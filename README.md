# SlotSwapper 🔄

A modern, full-stack calendar event swapping application that allows users to manage their schedules by exchanging time slots with other users. Built with Next.js and Django REST Framework.

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://slot-swapper-a2ge.vercel.app)
[![Backend API](https://img.shields.io/badge/API-active-blue)](https://slotswapper-1-izr3.onrender.com)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture & Design Choices](#architecture--design-choices)
- [Setup & Installation](#setup--installation)
- [API Endpoints](#api-endpoints)
- [Usage Examples](#usage-examples)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)

---

## 🎯 Overview

**SlotSwapper** is a calendar management application designed to solve scheduling conflicts by enabling users to:
- Create and manage their calendar events
- Mark events as "swappable" when they want to exchange time slots
- Browse other users' swappable slots
- Send and receive swap requests
- Automatically exchange event ownership upon acceptance

### Use Cases
- **Students**: Swap class schedules or study sessions
- **Professionals**: Exchange meeting times or shift schedules
- **Teams**: Coordinate availability and redistribute workloads

---

## ✨ Features

### User Management
- ✅ User registration and authentication
- ✅ JWT-based secure authentication
- ✅ Profile management
- ✅ Protected routes and API endpoints

### Calendar Management
- ✅ Create, read, update, and delete events
- ✅ Mark events as BUSY, SWAPPABLE, or SWAP_PENDING
- ✅ View personal calendar dashboard
- ✅ Time-based event filtering

### Swap Functionality
- ✅ Browse marketplace of swappable slots
- ✅ Send swap requests with optional messages
- ✅ Accept or reject incoming swap requests
- ✅ Automatic event ownership transfer on acceptance
- ✅ Cancel pending swap requests
- ✅ View incoming and outgoing swap requests

### UI/UX
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Dark mode support
- ✅ Real-time status updates
- ✅ Intuitive event cards with color coding
- ✅ Toast notifications for user actions

---

## 🛠 Tech Stack

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **Animations**: Framer Motion
- **Date Handling**: date-fns
- **State Management**: React Context API
- **HTTP Client**: Fetch API with custom hooks

### Backend
- **Framework**: [Django 4.2](https://www.djangoproject.com/)
- **API**: Django REST Framework
- **Authentication**: JWT (PyJWT)
- **Database**: PostgreSQL (Neon)
- **CORS**: django-cors-headers
- **Server**: Gunicorn + Whitenoise

### DevOps & Tools
- **Version Control**: Git & GitHub
- **Frontend Hosting**: [Vercel](https://vercel.com)
- **Backend Hosting**: [Render](https://render.com)
- **Database Hosting**: [Neon](https://neon.tech)
- **Package Managers**: pnpm (frontend), pip (backend)

---

## 🏗 Architecture & Design Choices

### 1. **Monorepo Structure**
**Choice**: Single repository with separate frontend and backend directories.
- **Why**: Simplifies version control, deployment synchronization, and collaborative development
- **Trade-off**: Larger repo size, but better cohesion between frontend and backend

### 2. **JWT Authentication**
**Choice**: Stateless JWT tokens instead of session-based authentication.
- **Why**: Scalable for distributed systems, enables easy frontend-backend separation
- **Implementation**: Access token (1 hour) + Refresh token (24 hours)
- **Security**: Tokens stored in memory (Context API), not localStorage

### 3. **Status-Based Event Management**
**Choice**: Three event statuses (BUSY, SWAPPABLE, SWAP_PENDING).
```
BUSY → User's regular events, not available for swapping
SWAPPABLE → User has marked as available for exchange
SWAP_PENDING → Currently involved in an active swap request
```
- **Why**: Clear state machine prevents concurrent swap conflicts
- **Auto-cancellation**: When a swap is accepted, all other pending requests for those events are automatically cancelled

### 4. **Atomic Swap Operations**
**Choice**: Swap logic handled entirely in the backend with database transactions.
- **Why**: Ensures data consistency and prevents race conditions
- **Implementation**: Django's `@transaction.atomic` decorator guarantees all-or-nothing swaps

### 5. **Component-Based Architecture**
**Choice**: Reusable UI components with consistent design system (shadcn/ui).
- **Why**: Faster development, consistent UX, easier maintenance
- **Customization**: Extended base components with app-specific logic

### 6. **Protected Routes with Context**
**Choice**: React Context for auth state + Protected Route wrapper component.
- **Why**: Centralized auth logic, automatic redirects, persistent login state
- **User Experience**: Seamless navigation without repeated authentication

### 7. **API Response Normalization**
**Choice**: Backend returns UTC timestamps, frontend converts to local time.
- **Why**: Handles users across different timezones correctly
- **Display**: All times shown in user's local 12-hour format

### 8. **Optimistic UI Updates**
**Choice**: Custom hooks (`use-api.ts`) with loading and error states.
- **Why**: Immediate user feedback, better perceived performance
- **Fallback**: Proper error handling and state rollback on API failure

---

## 🚀 Setup & Installation

### Prerequisites
- **Node.js** 18+ and **pnpm**
- **Python** 3.11+
- **PostgreSQL** (or use the provided Neon database)
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/pushtisonawala/SlotSwapper.git
cd SlotSwapper
```

### 2. Frontend Setup

```bash
# Install dependencies
pnpm install

# Create environment file
cp .env.example .env.local

# Edit .env.local and add:
# NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Run development server
pnpm dev
```

The frontend will be available at `http://localhost:3000`

### 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Edit .env and configure (see Environment Variables section)

# Run migrations
python manage.py migrate

# Create superuser (admin)
python manage.py createsuperuser

# Populate sample data (optional)
python manage.py populate_sample_data --clear

# Run development server
python manage.py runserver 8000
```

The backend API will be available at `http://localhost:8000`

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api
- **Admin Panel**: http://localhost:8000/admin

---

## 📡 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required | Request Body |
|--------|----------|-------------|---------------|--------------|
| `POST` | `/api/auth/register/` | Register new user | ❌ | `{ email, username, password, first_name, last_name }` |
| `POST` | `/api/auth/login/` | Login and get JWT tokens | ❌ | `{ email, password }` |
| `GET` | `/api/auth/profile/` | Get current user profile | ✅ | - |
| `PUT` | `/api/auth/profile/` | Update user profile | ✅ | `{ first_name, last_name }` |

### Event Management Endpoints

| Method | Endpoint | Description | Auth Required | Request Body |
|--------|----------|-------------|---------------|--------------|
| `GET` | `/api/events/` | List user's events | ✅ | - |
| `POST` | `/api/events/` | Create new event | ✅ | `{ title, description, start_time, end_time, status }` |
| `GET` | `/api/events/{id}/` | Get specific event | ✅ | - |
| `PUT` | `/api/events/{id}/` | Update event | ✅ | `{ title, description, start_time, end_time, status }` |
| `DELETE` | `/api/events/{id}/` | Delete event | ✅ | - |
| `GET` | `/api/swappable-slots/` | Get all swappable events (marketplace) | ✅ | - |

### Swap Request Endpoints

| Method | Endpoint | Description | Auth Required | Request Body |
|--------|----------|-------------|---------------|--------------|
| `POST` | `/api/swap-request/` | Create swap request | ✅ | `{ my_slot_id, their_slot_id, message }` |
| `POST` | `/api/swap-response/{id}/` | Accept/reject swap request | ✅ | `{ accept: true/false }` |
| `GET` | `/api/swap-requests/incoming/` | Get incoming swap requests | ✅ | - |
| `GET` | `/api/swap-requests/outgoing/` | Get outgoing swap requests | ✅ | - |
| `POST` | `/api/swap-requests/{id}/cancel/` | Cancel outgoing swap request | ✅ | - |

### Utility Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/health/` | Health check | ❌ |

### Authentication Header Format
```http
Authorization: Bearer <access_token>
```

---

## 📘 Usage Examples

### 1. Register a New User

**Request:**
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "username": "johndoe",
    "password": "SecurePass123!",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "john@example.com",
    "username": "johndoe",
    "first_name": "John",
    "last_name": "Doe"
  },
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### 2. Login

**Request:**
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe"
  },
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### 3. Create an Event

**Request:**
```bash
curl -X POST http://localhost:8000/api/events/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_access_token>" \
  -d '{
    "title": "Team Meeting",
    "description": "Weekly sync",
    "start_time": "2025-11-06T10:00:00Z",
    "end_time": "2025-11-06T11:00:00Z",
    "status": "SWAPPABLE"
  }'
```

**Response:**
```json
{
  "id": 1,
  "title": "Team Meeting",
  "description": "Weekly sync",
  "start_time": "2025-11-06T10:00:00Z",
  "end_time": "2025-11-06T11:00:00Z",
  "status": "SWAPPABLE",
  "owner": 1,
  "owner_name": "John Doe",
  "created_at": "2025-11-05T15:30:00Z",
  "updated_at": "2025-11-05T15:30:00Z"
}
```

### 4. Browse Swappable Slots (Marketplace)

**Request:**
```bash
curl -X GET http://localhost:8000/api/swappable-slots/ \
  -H "Authorization: Bearer <your_access_token>"
```

**Response:**
```json
[
  {
    "id": 5,
    "title": "Study Session",
    "description": "Chemistry review",
    "start_time": "2025-11-06T14:00:00Z",
    "end_time": "2025-11-06T16:00:00Z",
    "status": "SWAPPABLE",
    "owner": 2,
    "owner_name": "Jane Smith"
  },
  {
    "id": 8,
    "title": "Gym Time",
    "start_time": "2025-11-06T18:00:00Z",
    "end_time": "2025-11-06T19:30:00Z",
    "status": "SWAPPABLE",
    "owner": 3,
    "owner_name": "Bob Wilson"
  }
]
```

### 5. Create a Swap Request

**Request:**
```bash
curl -X POST http://localhost:8000/api/swap-request/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_access_token>" \
  -d '{
    "my_slot_id": 1,
    "their_slot_id": 5,
    "message": "Hi! Would love to swap. Is this time good for you?"
  }'
```

**Response:**
```json
{
  "id": 1,
  "requester": {
    "id": 1,
    "name": "John Doe"
  },
  "requested": {
    "id": 2,
    "name": "Jane Smith"
  },
  "requester_slot": {
    "id": 1,
    "title": "Team Meeting",
    "start_time": "2025-11-06T10:00:00Z",
    "end_time": "2025-11-06T11:00:00Z"
  },
  "requested_slot": {
    "id": 5,
    "title": "Study Session",
    "start_time": "2025-11-06T14:00:00Z",
    "end_time": "2025-11-06T16:00:00Z"
  },
  "message": "Hi! Would love to swap. Is this time good for you?",
  "status": "PENDING",
  "created_at": "2025-11-05T15:45:00Z"
}
```

### 6. Accept a Swap Request

**Request:**
```bash
curl -X POST http://localhost:8000/api/swap-response/1/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_access_token>" \
  -d '{ "accept": true }'
```

**Response:**
```json
{
  "message": "Swap request accepted successfully",
  "swap_request": {
    "id": 1,
    "status": "ACCEPTED"
  }
}
```

*Note: After acceptance, Event #1 now belongs to Jane, and Event #5 belongs to John. Both events' status changed to BUSY.*

---

## 📁 Project Structure

```
SlotSwapper/
├── README.md
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
├── .env.local
│
├── app/                          # Next.js 15 App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home (redirects)
│   ├── globals.css              # Global styles
│   ├── dashboard/               # User dashboard
│   │   └── page.tsx
│   ├── marketplace/             # Browse swappable slots
│   │   └── page.tsx
│   ├── requests/                # Swap requests management
│   │   └── page.tsx
│   ├── login/                   # Login page
│   │   └── page.tsx
│   └── signup/                  # Registration page
│       └── page.tsx
│
├── components/                   # React components
│   ├── navbar.tsx               # Navigation bar
│   ├── event-card.tsx           # Event display card
│   ├── protected-route.tsx      # Auth wrapper
│   ├── theme-provider.tsx       # Dark mode provider
│   └── ui/                      # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       └── ...
│
├── context/                      # React Context
│   └── auth-context.tsx         # Authentication state
│
├── hooks/                        # Custom React hooks
│   ├── use-api.ts               # API interaction hooks
│   ├── use-toast.ts             # Toast notifications
│   └── use-mobile.ts            # Responsive detection
│
├── lib/                          # Utilities
│   ├── utils.ts                 # Helper functions
│   └── api/
│       └── api-service.ts       # API client
│
└── backend/                      # Django REST API
    ├── manage.py
    ├── requirements.txt
    ├── Procfile                 # Render deployment
    ├── runtime.txt              # Python version
    ├── build.sh                 # Build script
    │
    ├── swap_calendar/           # Django project
    │   ├── settings.py          # Configuration
    │   ├── urls.py              # URL routing
    │   ├── wsgi.py              # WSGI application
    │   └── asgi.py              # ASGI application
    │
    └── api/                     # Main API app
        ├── models.py            # Database models
        ├── views.py             # API views
        ├── serializers.py       # DRF serializers
        ├── urls.py              # API routes
        ├── authentication.py    # JWT auth
        ├── middleware.py        # Custom middleware
        ├── admin.py             # Admin configuration
        ├── tests.py             # Unit tests
        │
        ├── migrations/          # Database migrations
        │   └── ...
        │
        └── management/          # Custom commands
            └── commands/
                ├── create_test_data.py
                └── populate_sample_data.py
```

---

## 🔐 Environment Variables

### Frontend (.env.local)

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# For production:
# NEXT_PUBLIC_API_URL=https://slotswapper-1-izr3.onrender.com/api
```

### Backend (.env)

```env
# Django Secret Key (generate a secure key for production)
SECRET_KEY=your-secret-key-here

# Debug mode (set to False in production)
DEBUG=True

# Allowed hosts (comma-separated)
ALLOWED_HOSTS=localhost,127.0.0.1,slotswapper-1-izr3.onrender.com

# Database URL (PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# JWT Configuration
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_LIFETIME=3600
JWT_REFRESH_TOKEN_LIFETIME=86400
```

**Generate a Secret Key:**
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

---

## 🚢 Deployment

### Frontend (Vercel)

1. Push your code to GitHub
2. Connect repository to Vercel
3. Set environment variables:
   - `NEXT_PUBLIC_API_URL=https://slotswapper-1-izr3.onrender.com/api`
4. Deploy automatically on push to main branch

**Live URL**: https://slot-swapper-a2ge.vercel.app

### Backend (Render)

1. Create new Web Service on Render
2. Connect GitHub repository
3. Configure:
   - **Build Command**: `./build.sh`
   - **Start Command**: `gunicorn swap_calendar.wsgi:application`
   - **Environment**: Python 3
4. Set environment variables (see Environment Variables section)
5. Add Render domain to `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`

**Live API**: https://slotswapper-1-izr3.onrender.com

### Database (Neon)

1. Create PostgreSQL database on Neon
2. Copy connection string
3. Add to `DATABASE_URL` environment variable
4. Run migrations: `python manage.py migrate`

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
python manage.py test
```

### Test API Manually

```bash
# Test health endpoint
curl http://localhost:8000/api/health/

# Run integration tests
python test_api.py
```

---

## 🐛 Troubleshooting

### CORS Errors
**Issue**: Frontend can't connect to backend
**Solution**: Ensure backend's `CORS_ALLOWED_ORIGINS` includes your frontend URL

```python
# In backend/swap_calendar/settings.py
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'https://your-vercel-app.vercel.app',
]
```

### JWT Authentication Fails
**Issue**: 401 Unauthorized errors
**Solution**: 
- Check token is included in headers: `Authorization: Bearer <token>`
- Verify token hasn't expired (1 hour lifetime)
- Re-login to get fresh tokens

### Database Connection Issues
**Issue**: Can't connect to PostgreSQL
**Solution**:
- Verify `DATABASE_URL` in environment variables
- Check SSL mode is set: `?sslmode=require`
- Ensure Neon database is active

### Events Not Showing Correct Time
**Issue**: Times display incorrectly
**Solution**: 
- Backend stores UTC times
- Frontend converts to local time automatically
- Check browser timezone settings

---

## 📝 Management Commands

### Populate Sample Data

```bash
python manage.py populate_sample_data --clear
```

Creates sample users and events for testing.

### Create Test Data

```bash
python manage.py create_test_data
```

Generates additional test data.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the MIT License.

---

## 👥 Authors

- **Pushti Sonawala** - [@pushtisonawala](https://github.com/pushtisonawala)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Django REST Framework](https://www.django-rest-framework.org/) for the powerful API toolkit
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Vercel](https://vercel.com/), [Render](https://render.com/), and [Neon](https://neon.tech/) for hosting services

---

## 📞 Support

For questions or issues, please:
- Open an issue on GitHub
- Contact: pushtisonawala@example.com

---

**Built with ❤️ by Pushti Sonawala**
