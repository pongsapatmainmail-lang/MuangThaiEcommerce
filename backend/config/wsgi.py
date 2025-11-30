"""
WSGI config for MuangThai project.
"""
import os
from django.core.wsgi import get_wsgi_application

# ใช้ production settings ถ้ามี RENDER environment variable
if os.environ.get('RENDER'):
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_production')
else:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

application = get_wsgi_application()