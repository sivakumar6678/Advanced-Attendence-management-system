from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from core.models import Branch
from teacher.models import Faculty
from .models import CRCProfile
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

class RegisterCRC(APIView):
    def post(self, request):
        data = request.data
        email = data.get("email")
        branch = data.get("branch")
        year = data.get("year")
        semester = data.get("semester")
        password = data.get("password")

        # ✅ Ensure faculty exists before registering CRC
        faculty = Faculty.objects.filter(email=email).first()
        if not faculty:
            return Response({"error": "Faculty not found"}, status=status.HTTP_404_NOT_FOUND)

        # ✅ Check if CRC already registered
        if CRCProfile.objects.filter(email=email).exists():
            return Response({"error": "CRC already registered"}, status=status.HTTP_400_BAD_REQUEST)

        # ✅ Register CRC in CRCProfile only
        crc = CRCProfile.objects.create(
            email=email,
            employee_id=faculty.employee_id,  # ✅ Use faculty's employee ID
            branch=branch,
            year=year,
            semester=semester
        )
        crc.set_password(password)  # ✅ Hash password before saving
        crc.save()

        return Response({"message": "CRC registered successfully"}, status=status.HTTP_201_CREATED)


class LoginCRC(APIView):
    def post(self, request):
        data = request.data
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return Response({"error": "Email and password are required"}, status=status.HTTP_400_BAD_REQUEST)

        # ✅ Authenticate CRC using `CRCProfile`
        crc = get_object_or_404(CRCProfile, email=email)
        if crc.check_password(password):
            # ✅ Generate custom JWT token without `User` model
            refresh = RefreshToken()
            refresh.payload = {"crc_id": crc.id, "email": crc.email}  # ✅ Custom claims

            return Response({
                "message": "Login successful",
                "access_token": str(refresh.access_token),
                "refresh_token": str(refresh),
                "employee_id": crc.employee_id,
                "branch": crc.branch,
                "year": crc.year,
                "semester": crc.semester
            }, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid password"}, status=status.HTTP_401_UNAUTHORIZED)


class CRCDashboardView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            email = request.user.email  # JWT authenticated user
            crc = get_object_or_404(CRCProfile, email=email)

            return Response({
                "employee_id": crc.employee_id,
                "email": crc.email,
                "branch": crc.branch,
                "year": crc.year,
                "semester": crc.semester
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