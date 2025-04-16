python manage.py collectstatic --noinput
python manage.py migrate
gunicorn attendance_system.wsgi:application
