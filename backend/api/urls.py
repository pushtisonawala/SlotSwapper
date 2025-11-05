from django.urls import path
from . import views

app_name = 'api'

urlpatterns = [
    # Health check
    path('health/', views.health_check, name='health_check'),
    
    # Authentication endpoints
    path('auth/register/', views.register, name='register'),
    path('auth/login/', views.login, name='login'),
    path('auth/profile/', views.profile, name='profile'),
    
    # Event/Calendar endpoints
    path('events/', views.EventListCreateView.as_view(), name='event_list_create'),
    path('events/<int:pk>/', views.EventDetailView.as_view(), name='event_detail'),
    path('swappable-slots/', views.swappable_slots, name='swappable_slots'),
    
    # Swap request endpoints
    path('swap-request/', views.create_swap_request, name='create_swap_request'),
    path('swap-response/<int:request_id>/', views.respond_to_swap_request, name='respond_to_swap_request'),
    path('swap-requests/incoming/', views.incoming_swap_requests, name='incoming_swap_requests'),
    path('swap-requests/outgoing/', views.outgoing_swap_requests, name='outgoing_swap_requests'),
    path('swap-requests/<int:request_id>/cancel/', views.cancel_swap_request, name='cancel_swap_request'),
]