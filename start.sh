#!/bin/bash
python attendance-backend/manage.py migrate --noinput
python attendance-backend/manage.py collectstatic --noinput
gunicorn attendance-backend.attendance_system.wsgi:application --bind 0.0.0.0:$PORT
