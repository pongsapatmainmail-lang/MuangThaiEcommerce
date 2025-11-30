#!/usr/bin/env bash
# ===========================================
# Build script for Render - Backend
# ===========================================
# วางไฟล์นี้ที่ backend/build.sh

set -o errexit

echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Running migrations..."
python manage.py migrate

echo "Build completed!"