from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from .models import Student
from core.models import Branch, AcademicYear
from django.db import IntegrityError
from django.contrib.auth import authenticate

class RegisterStudent(APIView):
    def post(self, request, *args, **kwargs):
        try:
            student_data = request.data
            # Ensure face_descriptor is a valid JSON array or object
            face_descriptor = student_data.get('faceDescriptor', None)

            student = Student.objects.create(
                student_id=student_data['studentId'],
                name=student_data['name'],
                email=student_data['email'],
                password=student_data['password'],
                branch_id=student_data['branch'],  # Use branch_id for FK
                year=student_data['year'],
                semester=student_data['semester'],
                phone_number=student_data['phoneNumber'],
                academic_year_id=student_data['academicYear'],  # Use academic_year_id for FK
                is_lateral_entry=student_data['isLateralEntry'],
                face_descriptor=face_descriptor  # Store as JSON
            )
            return Response({"message": "Student registered successfully!"}, status=201)
        except IntegrityError as e:
            return Response({"error": str(e)}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

class LoginStudent(APIView):
    def post(self, request):
        student_data = request.data
        identifier = student_data.get('studentIdOrEmail', '').strip()
        password = student_data.get('password', '').strip()

        if not identifier or not password:
            return Response({"error": "Student ID/Email and password are required"}, status=status.HTTP_400_BAD_REQUEST)

        # Check if input is an email or student ID
        student = Student.objects.filter(email=identifier).first() or Student.objects.filter(student_id=identifier).first()

        if student and student.check_password(password):
            return Response({"message": "Login successful"}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid student ID, email, or password"}, status=status.HTTP_401_UNAUTHORIZED)
