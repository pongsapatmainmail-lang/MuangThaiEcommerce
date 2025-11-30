"""
===========================================
Production Settings for Render
===========================================
เพิ่มไฟล์นี้ที่ backend/config/settings_production.py
แล้วแก้ไข settings.py ให้ import จากไฟล์นี้เมื่ออยู่บน production
"""
import os
import dj_database_url
from .settings import *

# ===========================================
# Security Settings
# ===========================================
DEBUG = False
SECRET_KEY = os.environ.get('SECRET_KEY')

# Render.com domain
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '.onrender.com').split(',')

# HTTPS Settings
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# ===========================================
# Database - PostgreSQL on Render
# ===========================================
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            conn_health_checks=True,
        )
    }

# ===========================================
# Static Files - WhiteNoise
# ===========================================
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# ===========================================
# CORS Settings
# ===========================================
CORS_ALLOWED_ORIGINS = os.environ.get(
    'CORS_ALLOWED_ORIGINS',
    'https://muangthai-web.onrender.com'
).split(',')

CORS_ALLOW_CREDENTIALS = True

# ===========================================
# Logging
# ===========================================
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# ===========================================
# Redis (ถ้าใช้)
# ===========================================
REDIS_URL = os.environ.get('REDIS_URL')
if REDIS_URL:
    CELERY_BROKER_URL = REDIS_URL
    CELERY_RESULT_BACKEND = REDIS_URL
    
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels_redis.core.RedisChannelLayer',
            'CONFIG': {
                'hosts': [REDIS_URL],
            },
        },
    }