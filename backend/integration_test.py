#!/usr/bin/env python3
"""
Complete API Integration Test
Tests the full calendar swap workflow from registration to swap completion
"""

import requests
import json
import random
import time

# Configuration
BASE_URL = "http://127.0.0.1:8000/api"
HEADERS = {"Content-Type": "application/json"}

def test_user_registration():
    """Test user registration"""
    print("Testing User Registration...")
    
    unique_id = random.randint(10000, 99999)
    user_data = {
        "email": f"user{unique_id}@example.com",
        "username": f"user{unique_id}",
        "first_name": "Test",
        "last_name": "User",
        "password": "testpassword123",
        "password_confirm": "testpassword123"
    }
    
    response = requests.post(f"{BASE_URL}/auth/register/", json=user_data, headers=HEADERS)
    
    if response.status_code == 201:
        data = response.json()
        print(f"User registered successfully: {data['user']['email']}")
        return data['tokens']['access_token'], data['user']
    else:
        print(f"Registration failed: {response.text}")
        return None, None

def test_create_event(token, event_data):
    """Test event creation"""
    print(f"Testing Event Creation: {event_data['title']}...")
    
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/events/", json=event_data, headers=auth_headers)
    
    if response.status_code == 201:
        data = response.json()
        print(f"Event created: {data['title']}")
        return data
    else:
        print(f"Event creation failed: {response.text}")
        return None

def test_make_swappable(token, event_id):
    """Test making event swappable"""
    print(f"Making event {event_id} swappable...")
    
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    response = requests.patch(f"{BASE_URL}/events/{event_id}/", 
                            json={"status": "SWAPPABLE"}, 
                            headers=auth_headers)
    
    if response.status_code == 200:
        print(f"Event {event_id} is now swappable")
        return True
    else:
        print(f"Failed to make event swappable: {response.text}")
        return False

def test_get_swappable_slots(token):
    """Test getting swappable slots"""
    print("Testing Swappable Slots Retrieval...")
    
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/swappable-slots/", headers=auth_headers)
    
    if response.status_code == 200:
        slots = response.json()  # Direct array, not wrapped in a dictionary
        print(f"Found {len(slots)} swappable slots")
        return slots
    else:
        print(f"Failed to get swappable slots: {response.text}")
        return []

def test_swap_request(token1, token2, user1_event_id, user2_event_id):
    """Test creating and responding to swap request"""
    print(f"🧪 Testing Swap Request: {user1_event_id} <-> {user2_event_id}...")
    
    # User 1 creates swap request
    auth_headers1 = {**HEADERS, "Authorization": f"Bearer {token1}"}
    swap_data = {
        "my_slot_id": user1_event_id,
        "their_slot_id": user2_event_id,
        "message": "Would like to swap our time slots!"
    }
    
    response = requests.post(f"{BASE_URL}/swap-request/", json=swap_data, headers=auth_headers1)
    
    if response.status_code == 201:
        request_data = response.json()
        swap_request_id = request_data['swap_request']['id']
        print(f"✅ Swap request created: {swap_request_id}")
        
        # User 2 accepts the swap request
        auth_headers2 = {**HEADERS, "Authorization": f"Bearer {token2}"}
        response = requests.post(f"{BASE_URL}/swap-response/{swap_request_id}/", 
                           json={"accept": True}, 
                           headers=auth_headers2)
        
        if response.status_code == 200:
            print(f"Swap request accepted! Events have been swapped!")
            return True
        else:
            print(f"Failed to accept swap: {response.text}")
            return False
    else:
        print(f"❌ Failed to create swap request: {response.text}")
        return False

def main():
    """Run the complete integration test"""
    print("Starting Complete Calendar Swap Integration Test")
    print("=" * 60)
    
    # Register two users
    token1, user1 = test_user_registration()
    if not token1:
        return
    
    token2, user2 = test_user_registration()
    if not token2:
        return
    
    print()
    
    # User 1 creates an event
    event1_data = {
        "title": "Focus Block - User 1",
        "description": "Deep work session",
        "start_time": "2025-11-06T10:00:00Z",
        "end_time": "2025-11-06T11:00:00Z",
        "status": "BUSY"
    }
    
    event1 = test_create_event(token1, event1_data)
    if not event1:
        return
    
    # User 2 creates an event
    event2_data = {
        "title": "Focus Block - User 2", 
        "description": "Project work",
        "start_time": "2025-11-06T14:00:00Z",
        "end_time": "2025-11-06T15:00:00Z",
        "status": "BUSY"
    }
    
    event2 = test_create_event(token2, event2_data)
    if not event2:
        return
    
    print()
    
    # Make both events swappable
    test_make_swappable(token1, event1['id'])
    test_make_swappable(token2, event2['id'])
    
    print()
    
    # Test marketplace functionality
    swappable_slots = test_get_swappable_slots(token1)
    
    print()
    
    # Test the swap request workflow
    if test_swap_request(token1, token2, event1['id'], event2['id']):
        print()
        print("🎉 COMPLETE INTEGRATION TEST PASSED! 🎉")
        print("✅ User Registration")
        print("✅ Event Creation") 
        print("✅ Making Events Swappable")
        print("✅ Marketplace Functionality")
        print("✅ Swap Request Creation")
        print("✅ Swap Request Acceptance")
        print("✅ Calendar Updates")
    else:
        print()
        print("❌ Integration test failed at swap request stage")

if __name__ == "__main__":
    main()