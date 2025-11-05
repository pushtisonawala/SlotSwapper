from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from api.models import Event
from datetime import datetime, timedelta

User = get_user_model()

class Command(BaseCommand):
    help = 'Create test data for swap functionality'

    def handle(self, *args, **options):
        # Create test users if they don't exist
        users = []
        for i, (email, name) in enumerate([
            ('user1@example.com', 'Alice'),
            ('user2@example.com', 'Bob'),
            ('user3@example.com', 'Charlie')
        ]):
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': f'user{i+1}',
                    'first_name': name,
                    'last_name': 'Test',
                    'password': 'password123'
                }
            )
            if created:
                user.set_password('password123')
                user.save()
                self.stdout.write(f'Created user: {email}')
            users.append(user)

        # Create some test events
        today = datetime.now().date()
        
        events_data = [
            # User 1 events
            (users[0], 'Morning Gym', '09:00', '10:00', 'SWAPPABLE'),
            (users[0], 'Lunch Meeting', '12:00', '13:00', 'BUSY'),
            
            # User 2 events  
            (users[1], 'Team Call', '10:00', '11:00', 'SWAPPABLE'),
            (users[1], 'Doctor Visit', '14:00', '15:00', 'SWAPPABLE'),
            
            # User 3 events
            (users[2], 'Piano Lesson', '15:00', '16:00', 'SWAPPABLE'),
            (users[2], 'Yoga Class', '08:00', '09:00', 'SWAPPABLE'),
        ]

        for user, title, start_time, end_time, status in events_data:
            start_datetime = datetime.combine(today, datetime.strptime(start_time, '%H:%M').time())
            end_datetime = datetime.combine(today, datetime.strptime(end_time, '%H:%M').time())
            
            event, created = Event.objects.get_or_create(
                owner=user,
                title=title,
                start_time=start_datetime,
                defaults={
                    'end_time': end_datetime,
                    'status': status,
                    'description': f'Test event for {user.first_name}'
                }
            )
            if created:
                self.stdout.write(f'Created event: {title} for {user.first_name}')

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created test data! '
                f'Users: {User.objects.count()}, Events: {Event.objects.count()}'
            )
        )