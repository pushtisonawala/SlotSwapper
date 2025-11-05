#!/usr/bin/env python
import os
import django
from datetime import datetime, timedelta
import random

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'swap_calendar.settings')
django.setup()

from api.models import User, Event

# Sample users
users_data = [
    {'email': 'john@example.com', 'username': 'john', 'first_name': 'John', 'last_name': 'Doe'},
    {'email': 'jane@example.com', 'username': 'jane', 'first_name': 'Jane', 'last_name': 'Smith'},
    {'email': 'mike@example.com', 'username': 'mike', 'first_name': 'Mike', 'last_name': 'Johnson'},
    {'email': 'sarah@example.com', 'username': 'sarah', 'first_name': 'Sarah', 'last_name': 'Wilson'},
    {'email': 'alex@example.com', 'username': 'alex', 'first_name': 'Alex', 'last_name': 'Martinez'},
]

# Create users
users = []
for user_data in users_data:
    user, created = User.objects.get_or_create(
        email=user_data['email'],
        defaults={
            'username': user_data['username'],
            'first_name': user_data['first_name'],
            'last_name': user_data['last_name']
        }
    )
    if created:
        user.set_password('password123')
        user.save()
    users.append(user)

print(f"Created {len(users)} users")

# Sample events
event_titles = [
    "Team Meeting", "Gym Session", "Doctor Appointment", "Lunch Date",
    "Coffee Meeting", "Training Workshop", "Piano Lesson", "Yoga Class",
    "Product Demo", "Client Presentation", "Book Club", "Dentist Visit",
    "Hair Appointment", "Car Service", "Webinar", "Physical Therapy",
    "Language Class", "Networking Event", "Therapy Session", "Online Course"
]

# Create events for each user
base_date = datetime.now().replace(hour=9, minute=0, second=0, microsecond=0)
events_created = 0

for i, user in enumerate(users):
    # Create 3-4 events per user
    for j in range(4):
        title = random.choice(event_titles)
        
        # Vary the days (today + next few days)
        event_date = base_date + timedelta(days=random.randint(0, 7))
        
        # Random time during work hours (9 AM to 6 PM)
        hour = random.randint(9, 17)
        minute = random.choice([0, 15, 30, 45])
        duration = random.choice([30, 45, 60, 90, 120])  # minutes
        
        start_time = event_date.replace(hour=hour, minute=minute)
        end_time = start_time + timedelta(minutes=duration)
        
        # Random status - make about 60% swappable for marketplace
        status = random.choice(['SWAPPABLE', 'SWAPPABLE', 'SWAPPABLE', 'BUSY', 'SWAP_PENDING'])
        
        event = Event.objects.create(
            title=title,
            description=f"Sample {title.lower()} event",
            start_time=start_time,
            end_time=end_time,
            status=status,
            owner=user
        )
        events_created += 1

print(f"Created {events_created} events")

# Show breakdown
swappable_count = Event.objects.filter(status='SWAPPABLE').count()
busy_count = Event.objects.filter(status='BUSY').count()
pending_count = Event.objects.filter(status='SWAP_PENDING').count()

print(f"Breakdown:")
print(f"- Swappable: {swappable_count}")
print(f"- Busy: {busy_count}")
print(f"- Pending: {pending_count}")
print(f"- Total: {Event.objects.count()}")