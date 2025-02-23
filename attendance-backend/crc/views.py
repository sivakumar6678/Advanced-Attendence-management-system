from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import CRC
from django.contrib.auth import authenticate
from django.db.utils import IntegrityError
from teacher.models import Faculty
from core.models import Branch 
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.hashers import make_password,check_password
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.shortcuts import get_object_or_404
from core.models import User

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from core.models import User  # ✅ Import User from core
from crc.models import CRC
from django.contrib.auth.hashers import make_password

class RegisterCRC(APIView):
    def post(self, request):
        email = request.data.get("email")
        employee_id = request.data.get("employee_id")
        phone_number = request.data.get("phone_number")
        branch_id = request.data.get("branch")  # Assuming branch is sent as an ID
        year = request.data.get("year")
        semester = request.data.get("semester")
        password = request.data.get("password")

        # Check if CRC exists in User
        existing_user = User.objects.filter(email=email).first()
        
        if existing_user:
            # Check if CRC is already registered
            existing_crc = CRC.objects.filter(email=email).first()
            if existing_crc:
                return Response({"error": "CRC already registered"}, status=status.HTTP_400_BAD_REQUEST)
            else:
                # If user exists but not registered as CRC, update existing user
                existing_user.role = "crc"
                existing_user.set_password(password)
                existing_user.save()

                # Create CRC profile linked to the existing user
                crc = CRC.objects.create(
                    id=existing_user.id,  # ✅ Use the same ID as User
                    email=email,
                    employee_id=employee_id,
                    phone_number=phone_number,
                    branch_id=branch_id,
                    year=year,
                    semester=semester
                )

                return Response({"message": "CRC registered successfully"}, status=status.HTTP_201_CREATED)

        # If user does not exist, create new User and CRC
        user = User.objects.create_user(
            email=email,
            role="crc",  # ✅ Set role as 'crc'
            password=make_password(password)
        )

        crc = CRC.objects.create(
            id=user.id,  # ✅ Use the same ID as User
            email=email,
            employee_id=employee_id,
            phone_number=phone_number,
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

        try:
            crc = get_object_or_404(CRC, email=email)  # Fetch CRC user
            if check_password(password, crc.password):  # Validate password
                refresh = RefreshToken.for_user(crc)  # Generate JWT token
                return Response({
                    "message": "Login successful",
                    "access_token": str(refresh.access_token),
                    "refresh_token": str(refresh)
                }, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Invalid password"}, status=status.HTTP_401_UNAUTHORIZED)

        except CRC.DoesNotExist:
            return Response({"error": "CRC user not found"}, status=status.HTTP_404_NOT_FOUND)


class CRCDashboardView(APIView):
    authentication_classes = [JWTAuthentication]  
    permission_classes = [IsAuthenticated]  

    def get(self, request):
        try:
            user = request.user  # JWT authenticated user
            print("User:", user)  # Debugging: Print the user object
            print("User email:", user.email)  # Debugging: Print the user email
            
            # Directly use the authenticated user (CRC instance)
            return Response({
                "crc_id": user.crc_id,
                "employee_id": user.employee_id,
                "email": user.email,
                "phone_number": user.phone_number,
                "branch": user.branch.name,  # Convert ID to name
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

