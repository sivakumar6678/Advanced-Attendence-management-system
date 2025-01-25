# student/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view

# Move the import inside the function to avoid circular imports
# from core.models import Student  # Remove this line

class RegisterStudent(APIView):
    def post(self, request, *args, **kwargs):
        from core.models import Student  # Move import here to avoid circular import issue
        
        student_data = request.data
        student = Student.objects.create(
            student_id=student_data['studentId'],
            name=student_data['name'],
            email=student_data['email'],
            password=student_data['password'],
            branch=student_data['branch'],
            year=student_data['year'],
            semester=student_data['semester'],
            phone_number=student_data['phoneNumber'],
            academic_year=student_data['academicYear'],
            is_lateral_entry=student_data['isLateralEntry'],
            face_descriptor=student_data['faceDescriptor']
        )
        return Response({"message": "Student registered successfully"}, status=status.HTTP_201_CREATED)

# Other views

class LoginStudent(APIView):
    def post(self, request):
        # Your login logic here
        return Response({"message": "Login successful"}, status=status.HTTP_200_OK)
    

class StudentDetailView(APIView):
    def get(self, request, pk):
        try:
            student = Student.objects.get(pk=pk)
            # Serialize student data, assuming a StudentSerializer exists
            return Response({"student": student.name, "id": student.id}, status=status.HTTP_200_OK)
        except Student.DoesNotExist:
            return Response({"message": "Student not found"}, status=status.HTTP_404_NOT_FOUND)
