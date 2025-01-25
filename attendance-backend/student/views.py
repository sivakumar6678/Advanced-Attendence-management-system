# student/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from .models import Student
from core.models import Branch, AcademicYear
# Move the import inside the function to avoid circular imports

class RegisterStudent(APIView):
    def post(self, request):
        student_data = request.data
        
        # Fetch Branch and AcademicYear instances
        try:
            branch_instance = Branch.objects.get(pk=student_data['branch'])  # Get the branch instance
            academic_year_instance = AcademicYear.objects.get(pk=student_data['academicYear'])  # Get the academic year instance
        except Branch.DoesNotExist:
            return Response({"error": "Branch not found"}, status=404)
        except AcademicYear.DoesNotExist:
            return Response({"error": "Academic Year not found"}, status=404)
        
        # Create the student
        student = Student.objects.create(
            student_id=student_data['studentId'],
            name=student_data['name'],
            email=student_data['email'],
            password=student_data['password'],
            branch=branch_instance,  # Pass the Branch instance
            year=student_data['year'],
            semester=student_data['semester'],
            phone_number=student_data['phoneNumber'],
            academic_year=academic_year_instance,  # Pass the AcademicYear instance
            is_lateral_entry=student_data['isLateralEntry'],
            face_descriptor=student_data['faceDescriptor']
        )
        
        return Response({"message": "Student registered successfully"}, status=201)

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
