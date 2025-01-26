# student/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from .models import Student
from core.models import Branch, AcademicYear
from django.db import IntegrityError

from django.db import IntegrityError

class RegisterStudent(APIView):
    def post(self, request, *args, **kwargs):
        try:
            student_data = request.data
            # Convert face_descriptor to bytes if provided
            face_descriptor = (
                student_data['faceDescriptor'].encode('utf-8')
                if 'faceDescriptor' in student_data and student_data['faceDescriptor']
                else None
            )
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
                face_descriptor=face_descriptor
            )
            return Response({"message": "Student registered successfully!"}, status=201)
        except IntegrityError as e:
            return Response({"error": str(e)}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


# Other views

class LoginStudent(APIView):
    def post(self, request):
        # Your login logic here
        return Response({"message": "Login successful"}, status=status.HTTP_200_OK)
    

# class StudentDetailView(APIView):
#     def get(self, request, pk):
#         try:
#             student = Student.objects.get(pk=pk)
#             # Serialize student data, assuming a StudentSerializer exists
#             return Response({"student": student.name, "id": student.id}, status=status.HTTP_200_OK)
#         except Student.DoesNotExist:
#             return Response({"message": "Student not found"}, status=status.HTTP_404_NOT_FOUND)
