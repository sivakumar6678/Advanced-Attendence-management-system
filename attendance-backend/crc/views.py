from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import CRCProfile
from teacher.models import Faculty  # ✅ Import Faculty model
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
class RegisterCRC(APIView):
    def post(self, request):
        data = request.data
        email = data.get("email")
        branch = data.get("branch")
        year = data.get("year")
        semester = data.get("semester")

        # ✅ Check if Faculty exists before registering CRC
        faculty = get_object_or_404(Faculty, email=email)

        # ✅ Check if CRC is already registered for this faculty
        if CRCProfile.objects.filter(faculty_ref=faculty).exists():
            return Response({"error": "CRC already registered"}, status=status.HTTP_400_BAD_REQUEST)

        # ✅ Register CRC linked to Faculty
        crc = CRCProfile.objects.create(
            faculty_ref=faculty,
            branch=branch,
            year=year,
            semester=semester
        )
        crc.save()

        return Response({"message": "CRC registered successfully!"}, status=status.HTTP_201_CREATED)
class LoginCRC(APIView):
    def post(self, request):
        data = request.data
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return Response({"error": "Email and password are required"}, status=status.HTTP_400_BAD_REQUEST)

        # ✅ Find Faculty first
        faculty = get_object_or_404(Faculty, email=email)
        
        # ✅ Find linked CRC
        crc = get_object_or_404(CRCProfile, faculty_ref=faculty)

        if faculty.check_password(password):  # ✅ Use Faculty's password
            # ✅ Generate JWT Token for authentication
            refresh = RefreshToken.for_user(crc)
            access_token = str(refresh.access_token)

            return Response({
                "message": "Login successful",
                "access_token": access_token,
                "refresh_token": str(refresh),
                "faculty_id": faculty.id,
                "email": faculty.email,
                "role": "crc"
            }, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid password"}, status=status.HTTP_401_UNAUTHORIZED)
class CRCDashboardView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user  # ✅ Get the authenticated user

            # ✅ Fetch CRC details based on Faculty reference
            crc = get_object_or_404(CRCProfile, faculty_ref=user)  # Use `faculty_ref` field

            return Response({
                "faculty_id": crc.faculty_ref.id,
                "email": crc.faculty_ref.email,
                "branch": crc.branch,
                "year": crc.year,
                "semester": crc.semester,
                "role": "crc"
            }, status=status.HTTP_200_OK)

        except CRCProfile.DoesNotExist:
            return Response({"error": "CRC Profile not found"}, status=status.HTTP_404_NOT_FOUND)

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