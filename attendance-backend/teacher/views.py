from django.http import JsonResponse
from django.contrib.auth import authenticate, login
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import get_user_model
from .models import Teacher
from core.models import Faculty
import json

User = get_user_model()

@csrf_exempt
def register_faculty(request):
    """Faculty Registration (Only if pre-approved by Super Admin)"""
    if request.method == "POST":
        data = json.loads(request.body)
        email = data.get("email")
        emp_id = data.get("employee_id")
        password = data.get("password")
        username = data.get("username")

        faculty = Faculty.objects.filter(email=email, employee_id=emp_id, registered=False).first()

        if faculty:
            # Create user
            user = User.objects.create_user(username=username, email=email, password=password, is_faculty=True)
            
            # Link to Teacher model
            Teacher.objects.create(user=user, faculty_ref=faculty)
            
            # Mark as registered
            faculty.registered = True
            faculty.save()

            return JsonResponse({"success": "Faculty registered successfully"}, status=201)

        return JsonResponse({"error": "Faculty not found in approved list"}, status=400)

    return JsonResponse({"error": "Invalid request"}, status=400)


@csrf_exempt
def faculty_login(request):
    """Faculty Login"""
    if request.method == "POST":
        data = json.loads(request.body)
        username = data.get("username")
        password = data.get("password")

        user = authenticate(username=username, password=password)

        if user and user.is_faculty:
            login(request, user)
            return JsonResponse({"success": "Login successful"}, status=200)

        return JsonResponse({"error": "Invalid credentials or not a faculty"}, status=400)

    return JsonResponse({"error": "Invalid request"}, status=400)
