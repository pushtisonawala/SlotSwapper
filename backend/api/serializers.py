from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User, Event, SwapRequest


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'username', 'first_name', 'last_name', 'password', 'password_confirm')

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Password and confirmation don't match")
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            user = authenticate(username=email, password=password)
            if not user:
                raise serializers.ValidationError('Invalid email or password')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            attrs['user'] = user
        else:
            raise serializers.ValidationError('Must include email and password')
        
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile"""
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'first_name', 'last_name', 'created_at')
        read_only_fields = ('id', 'email', 'created_at')


class EventSerializer(serializers.ModelSerializer):
    """Serializer for calendar events"""
    owner_email = serializers.EmailField(source='owner.email', read_only=True)
    owner_name = serializers.SerializerMethodField()
    duration_minutes = serializers.ReadOnlyField()
    is_past = serializers.ReadOnlyField()

    class Meta:
        model = Event
        fields = (
            'id', 'title', 'description', 'start_time', 'end_time', 
            'status', 'owner', 'owner_email', 'owner_name', 
            'duration_minutes', 'is_past', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'owner', 'created_at', 'updated_at')

    def get_owner_name(self, obj):
        return f"{obj.owner.first_name} {obj.owner.last_name}"

    def validate(self, attrs):
        """Validate event data"""
        start_time = attrs.get('start_time')
        end_time = attrs.get('end_time')

        # Only validate time fields if both are provided (for new events or when times are being updated)
        if start_time and end_time:
            if end_time <= start_time:
                raise serializers.ValidationError("End time must be after start time")

        # For partial updates, use existing instance values if not provided
        if self.instance:
            start_time = start_time or self.instance.start_time
            end_time = end_time or self.instance.end_time

        # Only check for overlapping events if we have valid times
        if start_time and end_time:
            # Check for overlapping events for the same user
            if self.instance:
                # Updating existing event
                overlapping = Event.objects.filter(
                    owner=self.instance.owner,
                    start_time__lt=end_time,
                    end_time__gt=start_time
                ).exclude(id=self.instance.id)
            else:
                # Creating new event
                user = self.context['request'].user
                overlapping = Event.objects.filter(
                    owner=user,
                    start_time__lt=end_time,
                    end_time__gt=start_time
                )

            if overlapping.exists():
                raise serializers.ValidationError("This event overlaps with an existing event")

        return attrs


class SwappableEventSerializer(serializers.ModelSerializer):
    """Serializer for swappable events (excludes owner's events)"""
    owner_email = serializers.EmailField(source='owner.email', read_only=True)
    owner_name = serializers.SerializerMethodField()
    duration_minutes = serializers.ReadOnlyField()

    class Meta:
        model = Event
        fields = (
            'id', 'title', 'description', 'start_time', 'end_time',
            'owner_email', 'owner_name', 'duration_minutes'
        )

    def get_owner_name(self, obj):
        return f"{obj.owner.first_name} {obj.owner.last_name}"


class SwapRequestSerializer(serializers.ModelSerializer):
    """Serializer for swap requests"""
    requester_email = serializers.EmailField(source='requester.email', read_only=True)
    requester_name = serializers.SerializerMethodField()
    receiver_email = serializers.EmailField(source='receiver.email', read_only=True)
    receiver_name = serializers.SerializerMethodField()
    requester_event_details = EventSerializer(source='requester_event', read_only=True)
    receiver_event_details = EventSerializer(source='receiver_event', read_only=True)

    class Meta:
        model = SwapRequest
        fields = (
            'id', 'requester', 'receiver', 'requester_event', 'receiver_event',
            'requester_email', 'requester_name', 'receiver_email', 'receiver_name',
            'requester_event_details', 'receiver_event_details',
            'status', 'message', 'created_at', 'updated_at', 'responded_at'
        )
        read_only_fields = (
            'id', 'requester', 'receiver', 'status', 'created_at', 
            'updated_at', 'responded_at'
        )

    def get_requester_name(self, obj):
        return f"{obj.requester.first_name} {obj.requester.last_name}"

    def get_receiver_name(self, obj):
        return f"{obj.receiver.first_name} {obj.receiver.last_name}"


class CreateSwapRequestSerializer(serializers.Serializer):
    """Serializer for creating swap requests"""
    my_slot_id = serializers.IntegerField()
    their_slot_id = serializers.IntegerField()
    message = serializers.CharField(required=False, allow_blank=True)

    def validate_my_slot_id(self, value):
        """Validate that the user owns this slot and it's swappable"""
        user = self.context['request'].user
        try:
            event = Event.objects.get(id=value, owner=user)
            if not event.is_swappable():
                raise serializers.ValidationError("Your event is not marked as swappable")
            return value
        except Event.DoesNotExist:
            raise serializers.ValidationError("Event not found or you don't own it")

    def validate_their_slot_id(self, value):
        """Validate that the target slot exists and is swappable"""
        user = self.context['request'].user
        try:
            event = Event.objects.get(id=value)
            if event.owner == user:
                raise serializers.ValidationError("Cannot swap with your own event")
            if not event.is_swappable():
                raise serializers.ValidationError("Target event is not available for swapping")
            return value
        except Event.DoesNotExist:
            raise serializers.ValidationError("Target event not found")

    def validate(self, attrs):
        """Check for existing pending swap requests"""
        my_slot_id = attrs['my_slot_id']
        their_slot_id = attrs['their_slot_id']
        
        # Check if there's already a pending swap request for these events
        existing = SwapRequest.objects.filter(
            requester_event_id=my_slot_id,
            receiver_event_id=their_slot_id,
            status=SwapRequest.StatusChoices.PENDING
        ).exists()
        
        if existing:
            raise serializers.ValidationError("You already have a pending swap request for these events")
        
        return attrs


class SwapResponseSerializer(serializers.Serializer):
    """Serializer for responding to swap requests"""
    accept = serializers.BooleanField()