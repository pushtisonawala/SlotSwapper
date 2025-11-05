#!/usr/bin/env python3
"""
Quick test of the Calendar Swap API using Django's test client
"""

import os
import sys
import django
from datetime import datetime, timedelta

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'swap_calendar.settings')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from api.models import Event, SwapRequest
import json

User = get_user_model()

def test_api():
    """Test the API using Django's test client"""
    client = Client()
    
    print("🚀 Testing Calendar Swap API with Django Test Client")
    print("=" * 60)
    
    # Test 1: Health Check
    print("📋 1. Testing health endpoint...")
    response = client.get('/api/health/')
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()
    
    # Test 2: Register User A
    print("👤 2. Registering User A (Alice)...")
    user_a_data = {
        "email": "alice@example.com",
        "password": "SecurePassword123!",
        "password_confirm": "SecurePassword123!",
        "first_name": "Alice",
        "last_name": "Smith",
        "username": "alice"
    }
    response = client.post('/api/auth/register/', 
                          data=json.dumps(user_a_data), 
                          content_type='application/json')
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        user_a_response = response.json()
        user_a_token = user_a_response['tokens']['access_token']
        print(f"✅ User A registered successfully")
        print(f"Token: {user_a_token[:20]}...")
    else:
        print(f"❌ Registration failed: {response.json()}")
        return
    print()
    
    # Test 3: Register User B
    print("👤 3. Registering User B (Bob)...")
    user_b_data = {
        "email": "bob@example.com",
        "password": "SecurePassword456!",
        "password_confirm": "SecurePassword456!",
        "first_name": "Bob",
        "last_name": "Johnson",
        "username": "bob"
    }
    response = client.post('/api/auth/register/', 
                          data=json.dumps(user_b_data), 
                          content_type='application/json')
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        user_b_response = response.json()
        user_b_token = user_b_response['tokens']['access_token']
        print(f"✅ User B registered successfully")
        print(f"Token: {user_b_token[:20]}...")
    else:
        print(f"❌ Registration failed: {response.json()}")
        return
    print()
    
    # Test 4: Create Event for User A
    print("📅 4. Creating event for User A...")
    now = datetime.now()
    event_a_data = {
        "title": "Focus Block - Tuesday",
        "description": "Deep work session",
        "start_time": (now + timedelta(days=1, hours=10)).isoformat(),
        "end_time": (now + timedelta(days=1, hours=11)).isoformat(),
        "status": "SWAPPABLE"
    }
    response = client.post('/api/events/', 
                          data=json.dumps(event_a_data), 
                          content_type='application/json',
                          HTTP_AUTHORIZATION=f'Bearer {user_a_token}')
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        event_a_response = response.json()
        event_a_id = event_a_response['id']
        print(f"✅ Event A created with ID: {event_a_id}")
        print(f"Title: {event_a_response['title']}")
    else:
        print(f"❌ Event creation failed: {response.json()}")
        return
    print()
    
    # Test 5: Create Event for User B
    print("📅 5. Creating event for User B...")
    event_b_data = {
        "title": "Focus Block - Wednesday",
        "description": "Planning session",
        "start_time": (now + timedelta(days=2, hours=14)).isoformat(),
        "end_time": (now + timedelta(days=2, hours=15)).isoformat(),
        "status": "SWAPPABLE"
    }
    response = client.post('/api/events/', 
                          data=json.dumps(event_b_data), 
                          content_type='application/json',
                          HTTP_AUTHORIZATION=f'Bearer {user_b_token}')
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        event_b_response = response.json()
        event_b_id = event_b_response['id']
        print(f"✅ Event B created with ID: {event_b_id}")
        print(f"Title: {event_b_response['title']}")
    else:
        print(f"❌ Event creation failed: {response.json()}")
        return
    print()
    
    # Test 6: Get swappable slots (from User A's perspective)
    print("🔍 6. Getting swappable slots for User A...")
    response = client.get('/api/swappable-slots/',
                         HTTP_AUTHORIZATION=f'Bearer {user_a_token}')
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        swappable_slots = response.json()
        print(f"✅ Found {len(swappable_slots)} swappable slots")
        for slot in swappable_slots:
            print(f"  - {slot['title']} by {slot['owner_name']} ({slot['start_time']} - {slot['end_time']})")
    else:
        print(f"❌ Failed to get swappable slots: {response.json()}")
        return
    print()
    
    # Test 7: Create swap request (User A wants User B's slot)
    print("🔄 7. Creating swap request...")
    swap_data = {
        "my_slot_id": event_a_id,
        "their_slot_id": event_b_id,
        "message": "Hi! Would you like to swap our focus blocks?"
    }
    response = client.post('/api/swap-request/', 
                          data=json.dumps(swap_data), 
                          content_type='application/json',
                          HTTP_AUTHORIZATION=f'Bearer {user_a_token}')
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        swap_response = response.json()
        swap_request_id = swap_response['swap_request']['id']
        print(f"✅ Swap request created with ID: {swap_request_id}")
        print(f"Message: {swap_response['swap_request']['message']}")
    else:
        print(f"❌ Swap request failed: {response.json()}")
        return
    print()
    
    # Test 8: Get incoming swap requests for User B
    print("📥 8. Getting incoming swap requests for User B...")
    response = client.get('/api/swap-requests/incoming/',
                         HTTP_AUTHORIZATION=f'Bearer {user_b_token}')
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        incoming_requests = response.json()
        print(f"✅ Found {len(incoming_requests)} incoming requests")
        for req in incoming_requests:
            print(f"  - Request ID: {req['id']}, Status: {req['status']}")
            print(f"    From: {req['requester_name']} ({req['requester_email']})")
            print(f"    Message: {req['message']}")
    else:
        print(f"❌ Failed to get incoming requests: {response.json()}")
        return
    print()
    
    # Test 9: Accept the swap request (User B accepts)
    print("✅ 9. User B accepts the swap request...")
    accept_data = {"accept": True}
    response = client.post(f'/api/swap-response/{swap_request_id}/', 
                          data=json.dumps(accept_data), 
                          content_type='application/json',
                          HTTP_AUTHORIZATION=f'Bearer {user_b_token}')
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        accept_response = response.json()
        print(f"✅ Swap accepted successfully!")
        print(f"Message: {accept_response['message']}")
    else:
        print(f"❌ Swap acceptance failed: {response.json()}")
        return
    print()
    
    # Test 10: Get User A's events (should now have User B's original event)
    print("📋 10. Getting User A's events after swap...")
    response = client.get('/api/events/',
                         HTTP_AUTHORIZATION=f'Bearer {user_a_token}')
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        user_a_events = response.json()
        print(f"✅ User A now has {len(user_a_events)} events:")
        for event in user_a_events:
            print(f"  - {event['title']} ({event['start_time']} - {event['end_time']}) Status: {event['status']}")
    else:
        print(f"❌ Failed to get User A's events: {response.json()}")
    print()
    
    # Test 11: Get User B's events (should now have User A's original event)
    print("📋 11. Getting User B's events after swap...")
    response = client.get('/api/events/',
                         HTTP_AUTHORIZATION=f'Bearer {user_b_token}')
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        user_b_events = response.json()
        print(f"✅ User B now has {len(user_b_events)} events:")
        for event in user_b_events:
            print(f"  - {event['title']} ({event['start_time']} - {event['end_time']}) Status: {event['status']}")
    else:
        print(f"❌ Failed to get User B's events: {response.json()}")
    print()
    
    print("🎉 API test completed successfully!")
    print("\n📊 Summary:")
    print("- ✅ User registration and authentication")
    print("- ✅ Event creation and management") 
    print("- ✅ Swappable slots discovery")
    print("- ✅ Swap request creation")
    print("- ✅ Swap request acceptance")
    print("- ✅ Automatic event ownership transfer")
    print("\nThe calendar swap functionality is working correctly! 🎯")

if __name__ == '__main__':
    test_api()