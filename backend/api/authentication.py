import jwt
from datetime import datetime, timedelta
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

User = get_user_model()


class JWTAuthentication(BaseAuthentication):
    """Custom JWT Authentication class"""
    
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return None
        
        token = auth_header.split(' ')[1]
        
        try:
            payload = jwt.decode(
                token, 
                settings.JWT_SECRET_KEY, 
                algorithms=[settings.JWT_ALGORITHM]
            )
            user_id = payload.get('user_id')
            if not user_id:
                raise AuthenticationFailed('Invalid token payload')
            
            user = User.objects.get(id=user_id)
            return (user, token)
        
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token has expired')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Invalid token')
        except User.DoesNotExist:
            raise AuthenticationFailed('User not found')


def generate_tokens(user):
    """Generate access and refresh tokens for a user"""
    access_payload = {
        'user_id': user.id,
        'email': user.email,
        'exp': datetime.utcnow() + timedelta(seconds=settings.JWT_ACCESS_TOKEN_LIFETIME),
        'iat': datetime.utcnow(),
        'type': 'access'
    }
    
    refresh_payload = {
        'user_id': user.id,
        'email': user.email,
        'exp': datetime.utcnow() + timedelta(seconds=settings.JWT_REFRESH_TOKEN_LIFETIME),
        'iat': datetime.utcnow(),
        'type': 'refresh'
    }
    
    access_token = jwt.encode(
        access_payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    
    refresh_token = jwt.encode(
        refresh_payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return {
        'access_token': access_token,
        'refresh_token': refresh_token,
        'expires_in': settings.JWT_ACCESS_TOKEN_LIFETIME
    }