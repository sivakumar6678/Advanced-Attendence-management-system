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
from teacher.models import AttendanceSession
from django.utils.timezone import now
from teacher.models import AttendanceSession
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
        device_id = student_data.get('deviceId', '').strip()  # Get device ID

        if not identifier or not password:
            return Response({"error": "Student ID/Email and password are required"}, status=status.HTTP_400_BAD_REQUEST)

        student = Student.objects.filter(email=identifier).first() or Student.objects.filter(student_id=identifier).first()

        if student:
            # if check_password(password, student.password):  # Verify password
            if student.check_password(password): 
                if student.device_id == device_id:
                    refresh = RefreshToken.for_user(student)  # Generate JWT token
                    return Response({
                        "message": "Login successful",
                        "access_token": str(refresh.access_token),
                        "refresh_token": str(refresh),
                        "student_id": student.student_id
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({"error": "Unauthorized device. Please use your registered device or contact admin."}, status=status.HTTP_401_UNAUTHORIZED)
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
                "parent_phone_number": student.parent_phone_number,
                "device_name": student.device.device_name  # Send device name to the frontend
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class ActiveAttendanceSessionsView(APIView):
    def get(self, request, student_id):
        try:
            student = Student.objects.get(id=student_id)

            # ✅ Fetch only active sessions for student's branch/year/semester
            active_sessions = AttendanceSession.objects.filter(
                branch=student.branch,
                year=student.year,
                semester=student.semester,
                is_active=True
            )

            sessions_data = [
                {
                    "session_id": session.id,
                    "subject_name": session.subject.name,
                    "day": session.day,
                    "periods": session.periods,
                    "modes": session.modes,
                    "start_time": session.start_time,
                }
                for session in active_sessions
            ]

            return Response(sessions_data, status=status.HTTP_200_OK)

        except Student.DoesNotExist:
            return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)
        
class MarkAttendanceView(APIView):
    def post(self, request):
        data = request.data
        student_id = data.get('student_id')
        session_id = data.get('session_id')
        student_latitude = data.get('latitude')
        student_longitude = data.get('longitude')

        try:
            session = AttendanceSession.objects.get(id=session_id, is_active=True)
        except AttendanceSession.DoesNotExist:
            return Response({"error": "Invalid or expired session"}, status=status.HTTP_400_BAD_REQUEST)

        # ✅ Match attendance mode
        if "GPS" in session.modes:
            # Compare student's GPS with faculty's GPS
            faculty_latitude = session.latitude
            faculty_longitude = session.longitude

            if abs(student_latitude - faculty_latitude) > 0.001 or abs(student_longitude - faculty_longitude) > 0.001:
                return Response({"error": "GPS location mismatch"}, status=status.HTTP_403_FORBIDDEN)

        # ✅ Mark attendance
        StudentAttendance.objects.create(
            student_id=student_id,
            session=session,
            timestamp=now(),
            status="Present"
        )

        return Response({"message": "Attendance marked successfully!"}, status=status.HTTP_200_OK)