from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.hashers import make_password
from django.shortcuts import get_object_or_404
from core.models import  User
from teacher.models import Faculty
from .models import CRCProfile
from core.models import Branch
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

class RegisterCRC(APIView):
    def post(self, request):
        email = request.data.get("email")
        employee_id = request.data.get("employee_id")
        branch_id = request.data.get("branch")
        year = request.data.get("year")
        semester = request.data.get("semester")
        password = request.data.get("password")

        # ✅ Check if the user already exists
        existing_user = User.objects.filter(email=email).first()
        if existing_user:
            if CRCProfile.objects.filter(user=existing_user).exists():
                return Response({"error": "CRC already registered"}, status=status.HTTP_400_BAD_REQUEST)
            return Response({"error": "Email is already registered as another role"}, status=status.HTTP_400_BAD_REQUEST)

        # ✅ Create a new User for authentication
        user = User.objects.create_user(
            email=email,
            role="crc",
            password=password
        )

        # ✅ Create a CRC profile linked to the User
        crc_profile = CRCProfile.objects.create(
            user=user,
            employee_id=employee_id,
            branch_id=branch_id,
            year=year,
            semester=semester
        )

        return Response({"message": "CRC registered successfully"}, status=status.HTTP_201_CREATED)


class LoginCRC(APIView):
    def post(self, request):
        data = request.data
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return Response({"error": "Email and password are required"}, status=status.HTTP_400_BAD_REQUEST)

        # ✅ Authenticate CRC using User table
        user = get_object_or_404(User, email=email, role="crc")
        if user.check_password(password):  
            refresh = RefreshToken.for_user(user)  # ✅ Generate JWT token

            # ✅ Get CRC-specific data from CRCProfile
            crc_profile = get_object_or_404(CRCProfile, user=user)

            return Response({
                "message": "Login successful",
                "access_token": str(refresh.access_token),
                "refresh_token": str(refresh),
                "employee_id": crc_profile.employee_id,
                "branch": crc_profile.branch.id,
                "year": crc_profile.year,
                "semester": crc_profile.semester
            }, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid password"}, status=status.HTTP_401_UNAUTHORIZED)


class CRCDashboardView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user  # JWT authenticated user
            print("User:", user)  # Debugging: Print the user object
            print("User email:", user.email)  # Debugging: Print the user email

            return Response({
                "crc_id": user.crc_id,
                "employee_id": user.employee_id,
                "email": user.email,
                "branch": user.branch.name,
                "year": user.year,
                "semester": user.semester
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FetchFacultyDetails(APIView):
    """Fetch Faculty Details Before CRC Registration"""
    def get(self, request):
        email = request.query_params.get('email', '').strip()
        employee_id = request.query_params.get('employee_id', '').strip()

        if not email or not employee_id:
            return Response({"error": "Email and Employee ID are required"}, status=status.HTTP_400_BAD_REQUEST)

        faculty = Faculty.objects.filter(email=email, employee_id=employee_id).first()
        if faculty:
            return Response({
                "full_name": faculty.full_name,
                "phone_number": faculty.phone_number,
                "branch": faculty.branch,
            }, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Faculty not found"}, status=status.HTTP_404_NOT_FOUND)
