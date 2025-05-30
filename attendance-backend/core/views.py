from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from core.models import Branch, AcademicYear, SuperAdmin, Faculty
from core.serializers import BranchSerializer
from core.serializers import AcademicYearSerializer
from django.contrib.auth import authenticate
from django.shortcuts import render, redirect
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404

class GenerateToken(APIView):
    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        if not email or not password:
            return Response({"error": "Email and password are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = Faculty.objects.get(email=email)  # Replace with your actual model (CRC, Teacher, etc.)
        except Faculty.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        # Check password (you should use hashed passwords in a real system)
        if user.password != password:
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        return Response({
            "access_token": str(refresh.access_token),
            "refresh_token": str(refresh)
        }, status=status.HTTP_200_OK)
class SuperAdminLogin(APIView):
    def post(self, request):
        data = request.data
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()

        if not email or not password:
            return Response({"error": "Email and password are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            superadmin = SuperAdmin.objects.get(email=email)

            if superadmin.password == password:  # Consider hashing passwords for security
                return Response({"message": "SuperAdmin login successful"}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Invalid email or password"}, status=status.HTTP_401_UNAUTHORIZED)

        except SuperAdmin.DoesNotExist:
            return Response({"error": "SuperAdmin not found"}, status=status.HTTP_404_NOT_FOUND)

class FacultyListView(APIView):
    def get(self, request):
        faculties = Faculty.objects.all()
        data = [{
            'name': faculty.name,
            'email': faculty.email,
            'employee_id': faculty.employee_id,
            'registered': faculty.registered
        } for faculty in faculties]
        return Response(data, status=status.HTTP_200_OK)

class AddFaculty(APIView):  # SuperAdmin adds faculty details only
    def post(self, request):
        data = request.data
        name = data.get("name")
        email = data.get("email")
        employee_id = data.get("employee_id")

        if not name or not email or not employee_id:
            return Response({"error": "All fields are required"}, status=status.HTTP_400_BAD_REQUEST)

        if Faculty.objects.filter(email=email).exists():
            return Response({"error": "Faculty with this email already exists"}, status=status.HTTP_400_BAD_REQUEST)

        faculty = Faculty.objects.create(name=name, email=email, employee_id=employee_id)
        return Response({"message": "Faculty details added successfully"}, status=status.HTTP_201_CREATED)

class BranchListCreate(APIView):
    def get(self, request):
        branches = Branch.objects.all()
        serializer = BranchSerializer(branches, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = BranchSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class BranchDetailUpdateDelete(APIView):
    def get_object(self, pk):
        return get_object_or_404(Branch, pk=pk)

    def put(self, request, pk):
        branch = self.get_object(pk)
        serializer = BranchSerializer(branch, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        branch = self.get_object(pk)
        branch.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class AcademicYearListCreate(APIView):
    def get(self, request):
        years = AcademicYear.objects.all()
        serializer = AcademicYearSerializer(years, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = AcademicYearSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AcademicYearDetailUpdateDelete(APIView):
    def get_object(self, pk):
        return get_object_or_404(AcademicYear, pk=pk)

    def put(self, request, pk):
        academic_year = self.get_object(pk)
        serializer = AcademicYearSerializer(academic_year, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        academic_year = self.get_object(pk)
        academic_year.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)