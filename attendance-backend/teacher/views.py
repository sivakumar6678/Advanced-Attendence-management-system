from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from core.models import Faculty as CoreFaculty  # Reference faculty added by SuperAdmin
from .models import Faculty
from .serializers import FacultyRegisterSerializer, FacultyLoginSerializer

class FacultyRegisterView(APIView):
    def post(self, request):
        data = request.data
        email = data.get('email')
        employee_id = data.get('employeeId')  # Match frontend field name
        full_name = data.get('fullName')
        branch = data.get('branch')
        phone_number = data.get('phoneNumber', None)
        password = data.get('password')
        joined_date = data.get('joinedDate')

        # Validate input
        if not email or not employee_id or not full_name or not branch or not password or not joined_date:
            return Response({"error": "All required fields must be provided"}, status=status.HTTP_400_BAD_REQUEST)

        # Check if faculty is pre-added by SuperAdmin
        try:
            core_faculty = CoreFaculty.objects.get(email=email, employee_id=employee_id)
        except CoreFaculty.DoesNotExist:
            return Response({"error": "Faculty details not found. Contact SuperAdmin."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if already registered
        if Faculty.objects.filter(email=email).exists():
            return Response({"error": "Faculty already registered"}, status=status.HTTP_400_BAD_REQUEST)

        # Register the faculty in teacher app
        faculty = Faculty.objects.create(
            full_name=full_name,
            email=email,
            branch=branch,
            phone_number=phone_number,
            employee_id=employee_id,
            joined_date=joined_date
        )
        faculty.set_password(password)  # Hash password before saving
        faculty.save()

        # Update registered status in core app
        core_faculty.registered = True
        core_faculty.save()

        return Response({"message": "Registration successful"}, status=status.HTTP_201_CREATED)
class FacultyLoginView(APIView):
    def post(self, request):
        serializer = FacultyLoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            
            faculty = authenticate(email=email, password=password)
            if faculty:
                return Response({"message": "Login successful"}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
