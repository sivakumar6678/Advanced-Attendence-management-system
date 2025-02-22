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

class RegisterCRC(APIView):
    def post(self, request, *args, **kwargs):
        try:
            crc_data = request.data
            employee_id = crc_data.get('employeeId')
            email = crc_data.get('email')
            phone_number = crc_data.get('phoneNumber')  # New field
            branch_id = crc_data.get('branch')
            year = crc_data.get('year')
            semester = crc_data.get('semester')
            password = crc_data.get('password')

            # ✅ Check if the faculty exists
            faculty = Faculty.objects.filter(employee_id=employee_id, email=email).first()
            if not faculty:
                return Response({"error": "Faculty not found. Only registered faculty can become CRC."}, status=status.HTTP_400_BAD_REQUEST)

            # ✅ Check if CRC is already assigned to this class (branch, year, semester)
            existing_crc = CRC.objects.filter(branch_id=branch_id, year=year, semester=semester).exists()
            if existing_crc:
                return Response({"error": "A CRC is already assigned for this class."}, status=status.HTTP_400_BAD_REQUEST)
            
            branch_instance = Branch.objects.get(id=crc_data['branch'])

            # ✅ Register the CRC
            crc = CRC.objects.create_crc(
                employee_id=employee_id,
                email=email,
                phone_number=phone_number,
                branch=branch_instance,
                year=year,
                semester=semester,
            )
            crc.set_password(password)  # ✅ Use set_password to hash password
            crc.save()
            return Response({"message": "CRC registered successfully!", "crc_id": crc.crc_id}, status=status.HTTP_201_CREATED)
        

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




