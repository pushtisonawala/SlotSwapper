from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Event, SwapRequest

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin configuration for User model"""
    list_display = ('email', 'get_full_name', 'is_active', 'is_staff', 'created_at')
    list_filter = ('is_active', 'is_staff', 'created_at')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('-created_at',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password1', 'password2'),
        }),
    )

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()
    get_full_name.short_description = 'Name'

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    """Admin configuration for Event model"""
    list_display = ('title', 'owner', 'start_time', 'end_time', 'status', 'created_at')
    list_filter = ('status', 'created_at', 'start_time')
    search_fields = ('title', 'owner__email', 'owner__first_name', 'owner__last_name')
    ordering = ('-start_time',)
    date_hierarchy = 'start_time'
    
    fieldsets = (
        (None, {'fields': ('title', 'description', 'owner')}),
        ('Schedule', {'fields': ('start_time', 'end_time')}),
        ('Status', {'fields': ('status',)}),
    )
    
    readonly_fields = ('created_at', 'updated_at')

@admin.register(SwapRequest)
class SwapRequestAdmin(admin.ModelAdmin):
    """Admin configuration for SwapRequest model"""
    list_display = (
        'id', 'requester', 'receiver', 
        'get_requester_event_title', 'get_receiver_event_title', 
        'status', 'created_at'
    )
    list_filter = ('status', 'created_at')
    search_fields = (
        'requester__email', 'receiver__email',
        'requester_event__title', 'receiver_event__title'
    )
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'
    
    fieldsets = (
        (None, {'fields': ('requester', 'receiver', 'status')}),
        ('Events', {'fields': ('requester_event', 'receiver_event')}),
        ('Message', {'fields': ('message',)}),
    )
    
    readonly_fields = ('created_at', 'updated_at', 'responded_at')
    
    def get_requester_event_title(self, obj):
        return obj.requester_event.title
    get_requester_event_title.short_description = 'Requester Event'
    
    def get_receiver_event_title(self, obj):
        return obj.receiver_event.title
    get_receiver_event_title.short_description = 'Receiver Event'
