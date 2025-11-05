from django.shortcuts import render
from django.http import JsonResponse
from django.db import transaction
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from .models import Event, SwapRequest
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer,
    EventSerializer, SwappableEventSerializer, SwapRequestSerializer,
    CreateSwapRequestSerializer, SwapResponseSerializer
)
from .authentication import generate_tokens

User = get_user_model()


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Health check endpoint"""
    return JsonResponse({
        'status': 'healthy',
        'timestamp': timezone.now().isoformat()
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """User registration endpoint"""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        tokens = generate_tokens(user)
        
        return Response({
            'message': 'User registered successfully',
            'user': UserProfileSerializer(user).data,
            'tokens': tokens
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """User login endpoint"""
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        tokens = generate_tokens(user)
        
        return Response({
            'message': 'Login successful',
            'user': UserProfileSerializer(user).data,
            'tokens': tokens
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def profile(request):
    """User profile endpoint"""
    if request.method == 'GET':
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EventListCreateView(generics.ListCreateAPIView):
    """List and create user's events"""
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Event.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class EventDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, and delete user's events"""
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Event.objects.filter(owner=self.request.user)

    def update(self, request, *args, **kwargs):
        """Override update to handle status changes"""
        instance = self.get_object()
        
        # If trying to change status to SWAPPABLE, check for conflicts
        new_status = request.data.get('status')
        if new_status == Event.StatusChoices.SWAPPABLE and instance.status != Event.StatusChoices.SWAPPABLE:
            # Check if event is in the past
            if instance.is_past():
                return Response(
                    {'error': 'Cannot mark past events as swappable'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        """Handle PATCH requests for partial updates"""
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def swappable_slots(request):
    """Get all swappable slots from other users"""
    # Get all swappable events that are not owned by the current user
    # and are not in the past
    swappable_events = Event.objects.filter(
        status=Event.StatusChoices.SWAPPABLE,
        end_time__gt=timezone.now()
    ).exclude(owner=request.user).order_by('start_time')
    
    serializer = SwappableEventSerializer(swappable_events, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_swap_request(request):
    """Create a new swap request"""
    serializer = CreateSwapRequestSerializer(data=request.data, context={'request': request})
    
    if serializer.is_valid():
        my_slot_id = serializer.validated_data['my_slot_id']
        their_slot_id = serializer.validated_data['their_slot_id']
        message = serializer.validated_data.get('message', '')
        
        try:
            with transaction.atomic():
                # Get the events
                my_event = Event.objects.select_for_update().get(
                    id=my_slot_id,
                    owner=request.user,
                    status=Event.StatusChoices.SWAPPABLE
                )
                
                their_event = Event.objects.select_for_update().get(
                    id=their_slot_id,
                    status=Event.StatusChoices.SWAPPABLE
                )
                
                # Don't allow swapping with own events
                if their_event.owner == request.user:
                    return Response(
                        {'error': 'Cannot swap with your own events'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Check if a swap request already exists
                existing_request = SwapRequest.objects.filter(
                    requester_event=my_event,
                    receiver_event=their_event,
                    status=SwapRequest.StatusChoices.PENDING
                ).first()
                
                if existing_request:
                    return Response(
                        {'error': 'A swap request already exists for these events'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Create the swap request
                swap_request = SwapRequest.objects.create(
                    requester=request.user,
                    receiver=their_event.owner,
                    requester_event=my_event,
                    receiver_event=their_event,
                    message=message
                )
                
                # Update both events to SWAP_PENDING status
                my_event.status = Event.StatusChoices.SWAP_PENDING
                their_event.status = Event.StatusChoices.SWAP_PENDING
                my_event.save()
                their_event.save()
                
                serializer = SwapRequestSerializer(swap_request)
                return Response({
                    'message': 'Swap request created successfully',
                    'swap_request': serializer.data
                }, status=status.HTTP_201_CREATED)
                
        except Event.DoesNotExist as e:
            if my_slot_id and not Event.objects.filter(id=my_slot_id, owner=request.user).exists():
                return Response(
                    {'error': 'Your event is not marked as swappable or does not exist'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                return Response(
                    {'error': 'Target event is not available for swapping'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {'error': f'Error creating swap request: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def respond_to_swap_request(request, request_id):
    """Respond to a swap request (accept/reject)"""
    try:
        swap_request = SwapRequest.objects.get(
            id=request_id,
            receiver=request.user,
            status=SwapRequest.StatusChoices.PENDING
        )
    except SwapRequest.DoesNotExist:
        return Response(
            {'error': 'Swap request not found or not authorized'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = SwapResponseSerializer(data=request.data)
    if serializer.is_valid():
        accept = serializer.validated_data['accept']
        
        try:
            if accept:
                swap_request.accept()
                message = 'Swap request accepted successfully'
            else:
                swap_request.reject()
                message = 'Swap request rejected'
            
            return Response({
                'message': message,
                'swap_request': SwapRequestSerializer(swap_request).data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def incoming_swap_requests(request):
    """Get incoming swap requests for the user"""
    swap_requests = SwapRequest.objects.filter(
        receiver=request.user
    ).order_by('-created_at')
    
    serializer = SwapRequestSerializer(swap_requests, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def outgoing_swap_requests(request):
    """Get outgoing swap requests from the user"""
    swap_requests = SwapRequest.objects.filter(
        requester=request.user
    ).order_by('-created_at')
    
    serializer = SwapRequestSerializer(swap_requests, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_swap_request(request, request_id):
    """Cancel an outgoing swap request"""
    try:
        swap_request = SwapRequest.objects.get(
            id=request_id,
            requester=request.user,
            status=SwapRequest.StatusChoices.PENDING
        )
    except SwapRequest.DoesNotExist:
        return Response(
            {'error': 'Swap request not found or not authorized'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        swap_request.cancel()
        return Response({
            'message': 'Swap request cancelled successfully',
            'swap_request': SwapRequestSerializer(swap_request).data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
