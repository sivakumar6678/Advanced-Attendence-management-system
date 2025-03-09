from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import IntegrityError
from django.contrib.auth.hashers import make_password, check_password
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Student, Device
from core.models import Branch, AcademicYear
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.shortcuts import get_object_or_404
class RegisterStudent(APIView):
    def post(self, request, *args, **kwargs):
        try:
            student_data = request.data
            face_descriptor = student_data.get('faceDescriptor', None)
            device_id = student_data.get('deviceId', None)  # Get device ID
            device_name = student_data.get('deviceName', None)
            device_type = student_data.get('deviceType', None)
            platform = student_data.get('platform', None)
            browser = student_data.get('browser', None)
            os_version = student_data.get('osVersion', None)
            screen_resolution = student_data.get('screenResolution', None)
            ip_address = student_data.get('ipAddress', None)

            if not device_id:
                return Response({"error": "Device ID is required"}, status=status.HTTP_400_BAD_REQUEST)

            # ✅ Step 1: Ensure device is valid before proceeding
            allowed_platforms = ["Windows", "Android", "iOS","Linux x86_64"]
            allowed_browsers = ["Chrome", "Firefox", "Safari"]

            if platform not in allowed_platforms:
                return Response({"error": f"Platform {platform} is not supported."}, status=status.HTTP_400_BAD_REQUEST)

            if browser not in allowed_browsers:
                return Response({"error": f"Browser {browser} is not supported."}, status=status.HTTP_400_BAD_REQUEST)

            # ✅ Step 2: Check if the device is already registered with another student
            if Student.objects.filter(device_id=device_id).exists():
                return Response({"error": "This device is already registered with another student"}, status=status.HTTP_400_BAD_REQUEST)

            # ✅ Step 3: Register the student **with the device details**
            student = Student(
                student_id=student_data['studentId'],
                name=student_data['name'],
                email=student_data['email'],
                branch_id=student_data['branch'],
                year=student_data['year'],
                semester=student_data['semester'],
                phone_number=student_data['phoneNumber'],
                parent_phone_number=student_data['phoneNumber1'],
                academic_year_id=student_data['academicYear'],
                is_lateral_entry=student_data['isLateralEntry'],
                face_descriptor=face_descriptor,
                device_id=device_id,  # Store device ID
            )

            student.set_password(student_data['password'])  # Hash password before saving
            student.save()

            # ✅ Step 4: Save device details along with student registration
            device = Device.objects.create(
                student=student,
                device_id=device_id,
                device_name=device_name,
                device_type=device_type,
                platform=platform,
                browser=browser,
                os_version=os_version,
                screen_resolution=screen_resolution,
                ip_address=ip_address
            )

            return Response({"message": "Student registered successfully!"}, status=status.HTTP_201_CREATED)

        except IntegrityError:
            return Response({"error": "Student ID or Email already exists"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LoginStudent(APIView):
    def post(self, request):
        student_data = request.data
        identifier = student_data.get('studentIdOrEmail', '').strip()
        password = student_data.get('password', '').strip()
        new_device_id = student_data.get('deviceId', '').strip()  # Device trying to login

        if not identifier or not password:
            return Response({"error": "Student ID/Email and password are required"}, status=status.HTTP_400_BAD_REQUEST)

        student = Student.objects.filter(email=identifier).first() or Student.objects.filter(student_id=identifier).first()

        if student:
            if student.check_password(password):  
                # ✅ Check if the device is already registered to the student
                if student.device_id == new_device_id:
                    refresh = RefreshToken.for_user(student)  
                    return Response({
                        "message": "Login successful",
                        "access_token": str(refresh.access_token),
                        "refresh_token": str(refresh),
                        "student_id": student.student_id
                    }, status=status.HTTP_200_OK)

                else:
                    # 🚀 **Fix: Allow Previously Registered Devices**
                    registered_device = Device.objects.filter(device_id=new_device_id, student=student).first()
                    if registered_device:
                        refresh = RefreshToken.for_user(student)
                        return Response({
                            "message": "Login successful from a previously registered device",
                            "access_token": str(refresh.access_token),
                            "refresh_token": str(refresh),
                            "student_id": student.student_id
                        }, status=status.HTTP_200_OK)

                    # 🚨 If the device is not recognized, reject login
                    return Response({"error": "Unrecognized device. Please register your device again or contact admin."}, status=status.HTTP_401_UNAUTHORIZED)

            else:
                return Response({"error": "Incorrect password"}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)


        
class StudentDashboardView(APIView):
    authentication_classes = [JWTAuthentication]  # Ensure JWT authentication is used
    permission_classes = [IsAuthenticated]  # Only logged-in users can access

    def get(self, request):
        try:
            user = request.user  # JWT authenticated user

            # ✅ Fix: Fetch student using email instead of ID
            student = get_object_or_404(Student, email=user.email)

            return Response({
                "student_id": student.student_id,
                "name": student.name,
                "email": student.email,
                "branch": student.branch.name,  # Convert ID to name
                "year": student.year,
                "semester": student.semester,
                "academic_year": f"{student.academic_year.start_year}-{student.academic_year.end_year}",
                "phone_number": student.phone_number,
                "parent_phone_number": student.parent_phone_number
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)