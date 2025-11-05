from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from .authentication import JWTAuthentication
import logging

logger = logging.getLogger(__name__)


class JWTAuthenticationMiddleware(MiddlewareMixin):
    """Middleware to handle JWT authentication"""
    
    def process_request(self, request):
        # Skip authentication for certain paths
        skip_paths = [
            '/api/auth/login/',
            '/api/auth/register/',
            '/api/health/',
            '/admin/',
        ]
        
        # Check if the path should skip authentication
        for path in skip_paths:
            if request.path.startswith(path):
                return None
        
        # Only apply JWT auth to API endpoints
        if not request.path.startswith('/api/'):
            return None
        
        try:
            auth = JWTAuthentication()
            result = auth.authenticate(request)
            
            if result:
                request.user, request.auth = result
            
        except Exception as e:
            logger.error(f"JWT Authentication error: {str(e)}")
            # Don't block the request, let the view handle it
            pass
        
        return None