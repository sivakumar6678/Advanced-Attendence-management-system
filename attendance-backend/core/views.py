from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from core.models import Branch, AcademicYear, SuperAdmin, Faculty
from core.serializers import BranchSerializer
from core.serializers import AcademicYearSerializer
from django.contrib.auth import authenticate
from django.shortcuts import render, redirect

class SuperAdminLogin(APIView):
    def post(self, request):
        data = request.data
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()

        if not email or not password:
            return Response({"error": "Email and password are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            superadmin = SuperAdmin.objects.get(email=email)

            if superadmin.password == password:  # Simple password check, you may want to hash it later
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


class RegisterFaculty(APIView):
    def post(self, request):
        data = request.data
        email = data.get("email")
        employee_id = data.get("employee_id")

        try:
            faculty = Faculty.objects.get(email=email, employee_id=employee_id)

            if faculty.registered:
                return Response({"message": "Faculty already registered."}, status=status.HTTP_400_BAD_REQUEST)
            else:
                # Proceed with faculty registration logic
                faculty.registered = True  # Mark as registered
                faculty.save()
                return Response({"message": "Faculty successfully registered."}, status=status.HTTP_201_CREATED)
        except Faculty.DoesNotExist:
            return Response({"error": "Faculty not found or not added by SuperAdmin."}, status=status.HTTP_404_NOT_FOUND)

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