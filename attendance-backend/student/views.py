from datetime import timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import IntegrityError
from django.contrib.auth.hashers import make_password, check_password
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Student, Device, StudentAttendance, DeviceReRegistrationRequest
from core.models import Branch, AcademicYear
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.shortcuts import get_object_or_404
from teacher.models import AttendanceSession
from django.utils.timezone import now
from teacher.models import AttendanceSession
from django.utils.timezone import now
from django.utils import timezone
from datetime import datetime
from .frs_utils import verify_face
from django.core.mail import send_mail
import os
import requests
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from django.shortcuts import render
from django.http import JsonResponse
import random , time
otp_storage = {}

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
            allowed_platforms = [
                "Windows",
                "Android",
                "iOS",
                "Linux x86_64",
                "Linux armv81",
                "Linux armv8l",
                "Linux aarch64"
            ]
            allowed_browsers = ["Chrome", "Firefox", "Safari"]

            if platform.lower().startswith("linux"):
                if "android" in browser.lower() or "mobile" in browser.lower():
                    platform = "Android"
                else:
                    platform = "Linux"

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


@method_decorator(csrf_exempt, name='dispatch')  # Disables CSRF for this view
class SendOtpToEmailView(APIView):
    def post(self, request):
        email = request.data.get('email')

        if not email:
            return Response({'status': 'error', 'message': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        otp = str(random.randint(100000, 999999))
        otp_storage[email] = {'otp': otp, 'expires_at': time.time() + 300}  # 5 mins expiry

        try:
            send_mail(
                'Your OTP for Device Re-registration',
                f'Your OTP is: {otp}',
                'admin@yourapp.com',
                [email],
                fail_silently=False,
            )
        except Exception as e:
            return Response({'status': 'error', 'message': f'Failed to send OTP: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'status': 'success', 'message': 'OTP sent to email.'})


@method_decorator(csrf_exempt, name='dispatch')
class VerifyOtpView(APIView):
    def post(self, request):
        email = request.data.get('email')
        entered_otp = request.data.get('otp')

        if not email or not entered_otp:
            return Response({'status': 'error', 'message': 'Email and OTP are required.'}, status=status.HTTP_400_BAD_REQUEST)

        otp_data = otp_storage.get(email)

        if otp_data and otp_data['otp'] == entered_otp and time.time() < otp_data['expires_at']:
            del otp_storage[email]
            return Response({'status': 'success', 'message': 'OTP verified. Device re-registered.'})
        
        return Response({'status': 'error', 'message': 'Invalid OTP or OTP expired.'}, status=status.HTTP_400_BAD_REQUEST)


class RequestDeviceReRegistrationView(APIView):
    
    def post(self, request):
        # Get the email from the request data (as the student will be logged in via email verification)
        email = request.data.get("email")  # Expecting the email in the body of the request
        
        if not email:
            return Response({"detail": "Email is required."}, status=400)
        
        try:
            student = Student.objects.get(email=email)
        except Student.DoesNotExist:
            return Response({"detail": "Student not found."}, status=404)

        # Check if pending request already exists
        if DeviceReRegistrationRequest.objects.filter(student=student, status='pending').exists():
            return Response({"detail": "Pending request already exists."}, status=400)

        reason = request.data.get("reason")
        device_info = request.data.get("device_info")

        if not reason or not device_info:
            return Response({"detail": "Reason and device_info are required."}, status=400)

        # Create the re-registration request
        req = DeviceReRegistrationRequest.objects.create(
            student=student,
            reason=reason,
            new_device_info=device_info,
            status="pending"  # Ensure status is set as pending initially
        )

        return Response({"detail": "Request submitted."}, status=201)


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
            student = Student.objects.get(student_id=student_id)

            # ✅ Mark expired sessions as inactive
            AttendanceSession.objects.filter(is_active=True, end_time__lte=now()).update(is_active=False)

            # ✅ Automatically activate sessions when their start time is reached
            AttendanceSession.objects.filter(is_active=False, start_time__lte=now(), end_time__gte=now()).update(is_active=True)

            # ✅ Fetch only active sessions for the student's branch & semester
            active_sessions = AttendanceSession.objects.filter(
                branch=student.branch,
                year=student.year,
                semester=student.semester,
                is_active=True
            )

            if not active_sessions.exists():
                return Response({"message": "No Active Sessions Available"}, status=status.HTTP_200_OK)

            sessions_data = [
                {
                    "session_id": session.id,
                    "subject_name": session.subject.name,
                    "day": session.day,
                    "periods": session.periods,
                    "modes": session.modes,
                    "start_time": session.start_time,
                    "end_time": session.end_time
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
        live_face_descriptor = data.get('face_descriptor')  # Face descriptor from frontend
        period = data.get('period')  # ✅ Get period from request

        # ✅ Validate required fields
        if not student_id or not session_id:
            return Response({"error": "Student ID and Session ID are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            student = Student.objects.get(student_id=student_id)
            session = AttendanceSession.objects.get(id=session_id, is_active=True)
        except Student.DoesNotExist:
            return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)
        except AttendanceSession.DoesNotExist:
            return Response({"error": "Invalid or inactive session"}, status=status.HTTP_404_NOT_FOUND)

        current_time = now()

        # ✅ Check if the session has already ended
        if session.end_time < current_time:
            # Auto-mark as absent if not already marked
            if not StudentAttendance.objects.filter(student=student, session=session).exists():
                StudentAttendance.objects.create(
                    student=student,
                    session=session,
                    timestamp=current_time,
                    period=session.periods[0] if session.periods else "Unknown Period",  # ✅ Ensure period is set                    
                    status="Absent"
                )
            return Response({"message": "Session has ended, attendance marked as absent."}, status=status.HTTP_200_OK)

        # ✅ Check if attendance is already marked
        if StudentAttendance.objects.filter(student=student, session=session).exists():
            return Response({"message": "Attendance already marked!"}, status=status.HTTP_200_OK)

        # ✅ Ensure attendance is marked only on the session's scheduled day
        today = current_time.strftime('%A')  # Ensuring correct day format
        if session.day != today:
            return Response({"error": "Attendance session is not active today"}, status=status.HTTP_400_BAD_REQUEST)

        periods = session.periods[0]

        # ✅ Check Faculty's Selected Modes
        requires_gps = "GPS" in session.modes
        requires_frs = "FRS" in session.modes

        # ✅ Verify GPS Location if required
        if requires_gps:
            faculty_latitude = session.latitude
            faculty_longitude = session.longitude

            if student_latitude is None or student_longitude is None:
                return Response({"error": "GPS coordinates missing"}, status=status.HTTP_400_BAD_REQUEST)

            # More accurate distance check
            distance = ((student_latitude - faculty_latitude) ** 2 + (student_longitude - faculty_longitude) ** 2) ** 0.5
            if distance > 0.001:  # ~100 meters tolerance
                return Response({"error": "GPS location mismatch"}, status=status.HTTP_403_FORBIDDEN)

        # ✅ Verify Face Recognition if required
        if requires_frs:
            if not live_face_descriptor:
                return Response({"error": "FRS verification required!"}, status=status.HTTP_400_BAD_REQUEST)

            stored_face_descriptor = student.face_descriptor
            if not verify_face(stored_face_descriptor, live_face_descriptor):
                return Response({"error": "Face recognition failed"}, status=status.HTTP_403_FORBIDDEN)

        # ✅ Mark attendance
        StudentAttendance.objects.create(
            student=student,
            session=session,
            timestamp=current_time,
            period=period,
            status="Present"
        )

        return Response({"message": "Attendance marked successfully!"}, status=status.HTTP_200_OK)
class GetAttendanceCountView(APIView):
    def get(self, request, session_id):
        try:
            session = AttendanceSession.objects.get(id=session_id)
            present_count = StudentAttendance.objects.filter(session=session, status="Present").count()
            return Response({"present_count": present_count}, status=status.HTTP_200_OK)
        except AttendanceSession.DoesNotExist:
            return Response({"error": "Session not found"}, status=status.HTTP_404_NOT_FOUND)

class GetAttendanceHistoryView(APIView):
    def get(self, request, student_id):  # Ensure student_id is received as a string
        try:
            student = Student.objects.get(student_id=student_id)  # Lookup by student_id (string)
            attendance_records = StudentAttendance.objects.filter(student=student).order_by('-timestamp')

            if not attendance_records.exists():
                return Response({"message": "No attendance records found"}, status=status.HTTP_200_OK)

            records_data = [
                {
                    "session_id": record.session.id,
                    "subject_name": record.session.subject.name,
                    "timestamp": record.timestamp,
                    "period" : record.period,
                    "status": record.status
                }
                for record in attendance_records
            ]

            return Response(records_data, status=status.HTTP_200_OK)

        except Student.DoesNotExist:
            return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)
        
class NotifyStreakLossView(APIView):
    def post(self, request):
        student_id = request.data.get("student_id")
        if not student_id:
            return Response({"error": "student_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            student = Student.objects.get(student_id=student_id)

            # Send Email or SMS
            message = f"""
Hi {student.name},

We noticed that your attendance streak has been broken. Try to attend regularly to maintain a high attendance streak and unlock more rewards!

Your Current Streak: 0 days

Keep going strong! 💪
"""

            # ✅ Example: Sending Email
            if student.email:
                send_mail(
                    subject="⚠️ Attendance Streak Broken",
                    message=message,
                    from_email=os.getenv("EMAIL_HOST_USER"),
                    recipient_list=[student.email],
                    fail_silently=False,
                )
                return Response({"message": "Email sent to student"}, status=status.HTTP_200_OK)

            # ✅ Example: Sending SMS (Twilio or similar)
            elif student.phone:
                # Placeholder for Twilio / SMS code
                requests.post("YOUR_SMS_API_URL", data={
                    "to": student.phone,
                    "message": message,
                })
                return Response({"message": "SMS sent to student"}, status=status.HTTP_200_OK)

            return Response({"message": "No contact info found for student"}, status=status.HTTP_400_BAD_REQUEST)

        except Student.DoesNotExist:
            return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)

