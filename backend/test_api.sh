#!/bin/bash

# Calendar Swap API Test Script
# This script tests the core functionality using curl commands

BASE_URL="http://127.0.0.1:8001/api"

echo "🚀 Testing Calendar Swap API with curl"
echo "======================================="

# Test 1: Health Check
echo "📋 1. Testing health endpoint..."
curl -s -X GET "$BASE_URL/health/" | python -m json.tool
echo ""

# Test 2: Register User A
echo "👤 2. Registering User A (Alice)..."
USER_A_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register/" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "password123",
    "password_confirm": "password123",
    "first_name": "Alice",
    "last_name": "Smith",
    "username": "alice"
  }')

echo "$USER_A_RESPONSE" | python -m json.tool
USER_A_TOKEN=$(echo "$USER_A_RESPONSE" | python -c "import sys, json; print(json.load(sys.stdin)['tokens']['access_token'])" 2>/dev/null)
echo "User A Token: $USER_A_TOKEN"
echo ""

# Test 3: Register User B
echo "👤 3. Registering User B (Bob)..."
USER_B_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register/" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bob@example.com",
    "password": "password123",
    "password_confirm": "password123",
    "first_name": "Bob",
    "last_name": "Johnson",
    "username": "bob"
  }')

echo "$USER_B_RESPONSE" | python -m json.tool
USER_B_TOKEN=$(echo "$USER_B_RESPONSE" | python -c "import sys, json; print(json.load(sys.stdin)['tokens']['access_token'])" 2>/dev/null)
echo "User B Token: $USER_B_TOKEN"
echo ""

# Test 4: Create Event for User A
echo "📅 4. Creating event for User A..."
USER_A_EVENT_RESPONSE=$(curl -s -X POST "$BASE_URL/events/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_A_TOKEN" \
  -d '{
    "title": "Focus Block - Tuesday",
    "description": "Deep work session",
    "start_time": "2025-11-06T10:00:00Z",
    "end_time": "2025-11-06T11:00:00Z",
    "status": "SWAPPABLE"
  }')

echo "$USER_A_EVENT_RESPONSE" | python -m json.tool
USER_A_EVENT_ID=$(echo "$USER_A_EVENT_RESPONSE" | python -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
echo "User A Event ID: $USER_A_EVENT_ID"
echo ""

# Test 5: Create Event for User B
echo "📅 5. Creating event for User B..."
USER_B_EVENT_RESPONSE=$(curl -s -X POST "$BASE_URL/events/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_B_TOKEN" \
  -d '{
    "title": "Focus Block - Wednesday",
    "description": "Planning session",
    "start_time": "2025-11-07T14:00:00Z",
    "end_time": "2025-11-07T15:00:00Z",
    "status": "SWAPPABLE"
  }')

echo "$USER_B_EVENT_RESPONSE" | python -m json.tool
USER_B_EVENT_ID=$(echo "$USER_B_EVENT_RESPONSE" | python -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
echo "User B Event ID: $USER_B_EVENT_ID"
echo ""

# Test 6: Get swappable slots (from User A's perspective)
echo "🔍 6. Getting swappable slots for User A..."
curl -s -X GET "$BASE_URL/swappable-slots/" \
  -H "Authorization: Bearer $USER_A_TOKEN" | python -m json.tool
echo ""

# Test 7: Create swap request (User A wants User B's slot)
echo "🔄 7. Creating swap request..."
SWAP_REQUEST_RESPONSE=$(curl -s -X POST "$BASE_URL/swap-request/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_A_TOKEN" \
  -d "{
    \"my_slot_id\": $USER_A_EVENT_ID,
    \"their_slot_id\": $USER_B_EVENT_ID,
    \"message\": \"Hi! Would you like to swap our focus blocks?\"
  }")

echo "$SWAP_REQUEST_RESPONSE" | python -m json.tool
SWAP_REQUEST_ID=$(echo "$SWAP_REQUEST_RESPONSE" | python -c "import sys, json; print(json.load(sys.stdin)['swap_request']['id'])" 2>/dev/null)
echo "Swap Request ID: $SWAP_REQUEST_ID"
echo ""

# Test 8: Get incoming swap requests for User B
echo "📥 8. Getting incoming swap requests for User B..."
curl -s -X GET "$BASE_URL/swap-requests/incoming/" \
  -H "Authorization: Bearer $USER_B_TOKEN" | python -m json.tool
echo ""

# Test 9: Accept the swap request (User B accepts)
echo "✅ 9. User B accepts the swap request..."
curl -s -X POST "$BASE_URL/swap-response/$SWAP_REQUEST_ID/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_B_TOKEN" \
  -d '{"accept": true}' | python -m json.tool
echo ""

# Test 10: Get User A's events (should now have User B's original event)
echo "📋 10. Getting User A's events after swap..."
curl -s -X GET "$BASE_URL/events/" \
  -H "Authorization: Bearer $USER_A_TOKEN" | python -m json.tool
echo ""

# Test 11: Get User B's events (should now have User A's original event)
echo "📋 11. Getting User B's events after swap..."
curl -s -X GET "$BASE_URL/events/" \
  -H "Authorization: Bearer $USER_B_TOKEN" | python -m json.tool
echo ""

echo "🎉 API test completed! Check the results above."
echo "The events should have been swapped between the users."