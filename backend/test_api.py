#!/usr/bin/env python3
"""
Test script for the Calendar Swap API
"""

import requests
import json
from datetime import datetime, timedelta

# Base URL for the API
BASE_URL = "http://127.0.0.1:8001/api"

def test_health():
    """Test the health endpoint"""
    response = requests.get(f"{BASE_URL}/health/")
    print("Health Check:", response.json())
    return response.status_code == 200

def register_user(email, password, first_name, last_name, username):
    """Register a new user"""
    data = {
        "email": email,
        "password": password,
        "password_confirm": password,
        "first_name": first_name,
        "last_name": last_name,
        "username": username
    }
    response = requests.post(f"{BASE_URL}/auth/register/", json=data)
    print(f"Register {email}:", response.status_code)
    if response.status_code == 201:
        result = response.json()
        print(f"Tokens: {result['tokens']}")
        return result['tokens']['access_token']
    else:
        print("Error:", response.json())
        return None

def login_user(email, password):
    """Login a user"""
    data = {
        "email": email,
        "password": password
    }
    response = requests.post(f"{BASE_URL}/auth/login/", json=data)
    print(f"Login {email}:", response.status_code)
    if response.status_code == 200:
        result = response.json()
        return result['tokens']['access_token']
    else:
        print("Error:", response.json())
        return None

def create_event(token, title, start_time, end_time, status="SWAPPABLE"):
    """Create a new event"""
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "title": title,
        "description": f"Test event: {title}",
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat(),
        "status": status
    }
    response = requests.post(f"{BASE_URL}/events/", json=data, headers=headers)
    print(f"Create Event '{title}':", response.status_code)
    if response.status_code == 201:
        return response.json()['id']
    else:
        print("Error:", response.json())
        return None

def get_swappable_slots(token):
    """Get all swappable slots"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/swappable-slots/", headers=headers)
    print("Get Swappable Slots:", response.status_code)
    if response.status_code == 200:
        slots = response.json()
        print(f"Found {len(slots)} swappable slots")
        return slots
    else:
        print("Error:", response.json())
        return []

def create_swap_request(token, my_slot_id, their_slot_id, message=""):
    """Create a swap request"""
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "my_slot_id": my_slot_id,
        "their_slot_id": their_slot_id,
        "message": message
    }
    response = requests.post(f"{BASE_URL}/swap-request/", json=data, headers=headers)
    print("Create Swap Request:", response.status_code)
    if response.status_code == 201:
        return response.json()['swap_request']['id']
    else:
        print("Error:", response.json())
        return None

def respond_to_swap_request(token, request_id, accept=True):
    """Respond to a swap request"""
    headers = {"Authorization": f"Bearer {token}"}
    data = {"accept": accept}
    response = requests.post(f"{BASE_URL}/swap-response/{request_id}/", json=data, headers=headers)
    print(f"Respond to Swap Request ({'Accept' if accept else 'Reject'}):", response.status_code)
    if response.status_code == 200:
        return True
    else:
        print("Error:", response.json())
        return False

def main():
    """Main test function"""
    print("🚀 Testing Calendar Swap API")
    print("=" * 50)
    
    # Test health
    if not test_health():
        print("❌ Health check failed")
        return
    print("✅ Health check passed\n")
    
    # Register users
    print("👤 Registering users...")
    user_a_token = register_user(
        "alice@example.com", "password123", "Alice", "Smith", "alice"
    )
    user_b_token = register_user(
        "bob@example.com", "password123", "Bob", "Johnson", "bob"
    )
    
    if not user_a_token or not user_b_token:
        print("❌ User registration failed")
        return
    print("✅ Users registered successfully\n")
    
    # Create events
    print("📅 Creating events...")
    now = datetime.now()
    
    # User A creates a Tuesday 10-11 AM event
    alice_event_id = create_event(
        user_a_token,
        "Focus Block - Tuesday",
        now + timedelta(days=1, hours=10),  # Tomorrow 10 AM
        now + timedelta(days=1, hours=11),  # Tomorrow 11 AM
        "SWAPPABLE"
    )
    
    # User B creates a Wednesday 2-3 PM event
    bob_event_id = create_event(
        user_b_token,
        "Focus Block - Wednesday", 
        now + timedelta(days=2, hours=14),  # Day after tomorrow 2 PM
        now + timedelta(days=2, hours=15),  # Day after tomorrow 3 PM
        "SWAPPABLE"
    )
    
    if not alice_event_id or not bob_event_id:
        print("❌ Event creation failed")
        return
    print("✅ Events created successfully\n")
    
    # Get swappable slots
    print("🔍 Getting swappable slots...")
    alice_slots = get_swappable_slots(user_a_token)
    bob_slots = get_swappable_slots(user_b_token)
    print("✅ Retrieved swappable slots\n")
    
    # Create swap request
    print("🔄 Creating swap request...")
    if alice_slots:
        swap_request_id = create_swap_request(
            user_a_token,
            alice_event_id,
            alice_slots[0]['id'],  # Bob's event
            "Hi! Would you like to swap our focus blocks?"
        )
        
        if swap_request_id:
            print("✅ Swap request created\n")
            
            # Respond to swap request
            print("✅ Responding to swap request...")
            if respond_to_swap_request(user_b_token, swap_request_id, accept=True):
                print("✅ Swap request accepted - events swapped!\n")
            else:
                print("❌ Failed to accept swap request")
        else:
            print("❌ Failed to create swap request")
    else:
        print("❌ No swappable slots found")
    
    print("🎉 API test completed successfully!")

if __name__ == "__main__":
    main()