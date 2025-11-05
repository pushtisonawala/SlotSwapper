from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


class User(AbstractUser):
    """Extended User model for the calendar swap application"""
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    def __str__(self):
        return f"{self.email} ({self.first_name} {self.last_name})"


class Event(models.Model):
    """Calendar events/slots that can be swapped"""
    
    class StatusChoices(models.TextChoices):
        BUSY = 'BUSY', 'Busy'
        SWAPPABLE = 'SWAPPABLE', 'Swappable'
        SWAP_PENDING = 'SWAP_PENDING', 'Swap Pending'

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(
        max_length=20,
        choices=StatusChoices.choices,
        default=StatusChoices.BUSY
    )
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='events'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_time']

    def __str__(self):
        return f"{self.title} - {self.owner.email} ({self.start_time.strftime('%Y-%m-%d %H:%M')})"

    def clean(self):
        """Validate that end_time is after start_time"""
        from django.core.exceptions import ValidationError
        if self.end_time <= self.start_time:
            raise ValidationError("End time must be after start time")

    @property
    def duration_minutes(self):
        """Get duration in minutes"""
        return int((self.end_time - self.start_time).total_seconds() / 60)

    def is_swappable(self):
        """Check if event can be swapped"""
        return self.status == self.StatusChoices.SWAPPABLE

    def is_past(self):
        """Check if event is in the past"""
        return self.end_time < timezone.now()


class SwapRequest(models.Model):
    """Requests to swap calendar events between users"""
    
    class StatusChoices(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        ACCEPTED = 'ACCEPTED', 'Accepted'
        REJECTED = 'REJECTED', 'Rejected'
        CANCELLED = 'CANCELLED', 'Cancelled'

    requester = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='outgoing_swap_requests'
    )
    receiver = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='incoming_swap_requests'
    )
    requester_event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='swap_requests_as_offered'
    )
    receiver_event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='swap_requests_as_requested'
    )
    status = models.CharField(
        max_length=20,
        choices=StatusChoices.choices,
        default=StatusChoices.PENDING
    )
    message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = [
            ['requester_event', 'receiver_event', 'status']
        ]

    def __str__(self):
        return f"Swap Request: {self.requester.email} wants {self.receiver_event.title} for {self.requester_event.title}"

    def clean(self):
        """Validate swap request"""
        from django.core.exceptions import ValidationError
        
        # Can't swap with yourself
        if self.requester == self.receiver:
            raise ValidationError("Cannot swap with yourself")
        
        # Can't swap your own events
        if self.requester_event.owner != self.requester:
            raise ValidationError("You can only offer your own events")
        
        if self.receiver_event.owner != self.receiver:
            raise ValidationError("Invalid receiver event")
        
        # Both events must be swappable or pending
        valid_statuses = [Event.StatusChoices.SWAPPABLE, Event.StatusChoices.SWAP_PENDING]
        if self.requester_event.status not in valid_statuses:
            raise ValidationError("Your event is not available for swapping")
        
        if self.receiver_event.status not in valid_statuses:
            raise ValidationError("Requested event is not available for swapping")

    def accept(self):
        """Accept the swap request and exchange event ownership"""
        from django.db import transaction
        
        with transaction.atomic():
            # Update swap request status
            self.status = self.StatusChoices.ACCEPTED
            self.responded_at = timezone.now()
            self.save()
            
            # Exchange event ownership
            requester_event = self.requester_event
            receiver_event = self.receiver_event
            
            # Swap owners
            original_requester = requester_event.owner
            original_receiver = receiver_event.owner
            
            requester_event.owner = original_receiver
            receiver_event.owner = original_requester
            
            # Set status back to BUSY
            requester_event.status = Event.StatusChoices.BUSY
            receiver_event.status = Event.StatusChoices.BUSY
            
            # Save events
            requester_event.save()
            receiver_event.save()
            
            # Cancel any other pending swap requests for these events
            SwapRequest.objects.filter(
                models.Q(requester_event=requester_event) | 
                models.Q(receiver_event=requester_event) |
                models.Q(requester_event=receiver_event) | 
                models.Q(receiver_event=receiver_event),
                status=self.StatusChoices.PENDING
            ).exclude(id=self.id).update(
                status=self.StatusChoices.CANCELLED,
                responded_at=timezone.now()
            )

    def reject(self):
        """Reject the swap request and restore event status"""
        from django.db import transaction
        
        with transaction.atomic():
            # Update swap request status
            self.status = self.StatusChoices.REJECTED
            self.responded_at = timezone.now()
            self.save()
            
            # Set events back to SWAPPABLE if they were SWAP_PENDING
            if self.requester_event.status == Event.StatusChoices.SWAP_PENDING:
                self.requester_event.status = Event.StatusChoices.SWAPPABLE
                self.requester_event.save()
            
            if self.receiver_event.status == Event.StatusChoices.SWAP_PENDING:
                self.receiver_event.status = Event.StatusChoices.SWAPPABLE
                self.receiver_event.save()

    def cancel(self):
        """Cancel the swap request (by requester)"""
        from django.db import transaction
        
        with transaction.atomic():
            # Update swap request status
            self.status = self.StatusChoices.CANCELLED
            self.responded_at = timezone.now()
            self.save()
            
            # Set events back to SWAPPABLE if they were SWAP_PENDING
            if self.requester_event.status == Event.StatusChoices.SWAP_PENDING:
                self.requester_event.status = Event.StatusChoices.SWAPPABLE
                self.requester_event.save()
            
            if self.receiver_event.status == Event.StatusChoices.SWAP_PENDING:
                self.receiver_event.status = Event.StatusChoices.SWAPPABLE
                self.receiver_event.save()
