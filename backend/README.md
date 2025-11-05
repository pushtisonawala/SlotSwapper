# Calendar Swap API Documentation

## Overview

This is a Django REST API for a calendar swap application where users can mark their calendar events as "swappable" and request to swap with other users' events.

## Features Implemented

### 1. User Authentication & JWT
- User registration with email, password, first name, last name
- JWT-based authentication for protected endpoints
- Custom User model extending Django's AbstractUser

### 2. Database Models

#### User Model
- Extended Django's AbstractUser
- Email as the primary identifier
- Required fields: email, username, first_name, last_name

#### Event Model
- Represents calendar events/slots
- Fields: title, description, start_time, end_time, status, owner
- Status choices: BUSY, SWAPPABLE, SWAP_PENDING

#### SwapRequest Model
- Represents swap requests between users
- Links two events and their owners
- Status choices: PENDING, ACCEPTED, REJECTED, CANCELLED
- Handles the swap logic automatically

### 3. API Endpoints

#### Authentication Endpoints
- `POST /api/auth/register/` - Register a new user
- `POST /api/auth/login/` - Login user and get JWT tokens
- `GET /api/auth/profile/` - Get user profile (protected)
- `PUT /api/auth/profile/` - Update user profile (protected)

#### Event/Calendar Endpoints
- `GET /api/events/` - List user's events (protected)
- `POST /api/events/` - Create new event (protected)
- `GET /api/events/<id>/` - Get specific event (protected)
- `PUT /api/events/<id>/` - Update event (protected)
- `DELETE /api/events/<id>/` - Delete event (protected)
- `GET /api/swappable-slots/` - Get all swappable events from other users (protected)

#### Swap Request Endpoints
- `POST /api/swap-request/` - Create a new swap request (protected)
- `POST /api/swap-response/<request_id>/` - Accept/reject swap request (protected)
- `GET /api/swap-requests/incoming/` - Get incoming swap requests (protected)
- `GET /api/swap-requests/outgoing/` - Get outgoing swap requests (protected)
- `POST /api/swap-requests/<request_id>/cancel/` - Cancel outgoing swap request (protected)

#### Utility Endpoints
- `GET /api/health/` - Health check endpoint (public)

## Core Swap Logic

### Creating a Swap Request
1. User A finds User B's swappable event via `/api/swappable-slots/`
2. User A creates swap request via `/api/swap-request/` with:
   - `my_slot_id`: User A's event ID
   - `their_slot_id`: User B's event ID
   - `message`: Optional message
3. Both events' status changes to `SWAP_PENDING`
4. User B receives the swap request

### Responding to Swap Request
1. User B views incoming requests via `/api/swap-requests/incoming/`
2. User B responds via `/api/swap-response/<request_id>/` with `{"accept": true/false}`

### If Accepted:
1. Event ownership is swapped (User A gets User B's event, User B gets User A's event)
2. Both events' status changes to `BUSY`
3. SwapRequest status becomes `ACCEPTED`
4. Other pending requests for these events are automatically cancelled

### If Rejected:
1. Both events' status returns to `SWAPPABLE`
2. SwapRequest status becomes `REJECTED`

## Database Configuration

The application is configured to use PostgreSQL with Neon database:
```
postgresql://neondb_owner:npg_J5BMaYwuUbW9@ep-divine-star-ahonwva6-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

## Security Features

- JWT tokens with configurable expiration
- Password validation
- CORS configuration for frontend integration
- Protected endpoints require valid JWT Bearer token
- Event ownership validation (users can only modify their own events)

## Example Usage Flow

1. **User Registration**:
   ```json
   POST /api/auth/register/
   {
     "email": "alice@example.com",
     "password": "securepassword",
     "password_confirm": "securepassword",
     "first_name": "Alice",
     "last_name": "Smith",
     "username": "alice"
   }
   ```

2. **Create Events**:
   ```json
   POST /api/events/
   {
     "title": "Focus Block",
     "start_time": "2025-11-06T10:00:00Z",
     "end_time": "2025-11-06T11:00:00Z",
     "status": "SWAPPABLE"
   }
   ```

3. **Find Swappable Slots**:
   ```json
   GET /api/swappable-slots/
   ```

4. **Create Swap Request**:
   ```json
   POST /api/swap-request/
   {
     "my_slot_id": 1,
     "their_slot_id": 2,
     "message": "Would you like to swap our focus blocks?"
   }
   ```

5. **Respond to Swap**:
   ```json
   POST /api/swap-response/1/
   {
     "accept": true
   }
   ```

## Running the Application

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Set up environment variables in `.env`:
   ```
   DATABASE_URL=postgresql://...
   SECRET_KEY=your-secret-key
   JWT_SECRET_KEY=your-jwt-secret
   ```

3. Run migrations:
   ```bash
   python manage.py migrate
   ```

4. Create superuser:
   ```bash
   python manage.py shell
   >>> from api.models import User
   >>> User.objects.create_superuser(email='admin@example.com', username='admin', first_name='Admin', last_name='User', password='admin123')
   ```

5. Start development server:
   ```bash
   python manage.py runserver 8001
   ```

The API will be available at `http://127.0.0.1:8001/api/`

## Admin Interface

Django admin is available at `http://127.0.0.1:8001/admin/` with the superuser credentials.

## Testing

A comprehensive test script `test_api.py` is included that demonstrates the complete swap workflow:
- User registration
- Event creation
- Swap request creation
- Swap acceptance
- Calendar updates