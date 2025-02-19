from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import IntegrityError
from django.contrib.auth.hashers import make_password, check_password
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Student, Device
from core.models import Branch, AcademicYear

class RegisterStudent(APIView):
    def post(self, request, *args, **kwargs):
        try:
            student_data = request.data
            face_descriptor = student_data.get('faceDescriptor', None)
            device_id = student_data.get('deviceId', None)  # Get device ID

            if not device_id:
                return Response({"error": "Device ID is required"}, status=status.HTTP_400_BAD_REQUEST)

            if Student.objects.filter(device_id=device_id).exists():
                return Response({"error": "This device is already registered with another student"}, status=status.HTTP_400_BAD_REQUEST)

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
                device_id=device_id  # Store device ID
            )

            student.password = make_password(student_data['password'])  # Hash password before saving
            student.save()

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

        # Fetch student using email or student ID
        student = Student.objects.filter(email=identifier).first() or Student.objects.filter(student_id=identifier).first()

        if student:
            if check_password(password, student.password):  # Verify password
                if student.device_id == device_id:
                    refresh = RefreshToken.for_user(student)  # Generate JWT token
                    return Response({
                        "message": "Login successful",
                        "access_token": str(refresh.access_token),
                        "refresh_token": str(refresh)
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({"error": "Unauthorized device. Please use your registered device or contact admin."}, status=status.HTTP_401_UNAUTHORIZED)
            else:
                return Response({"error": "Incorrect password"}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)

class RegisterDevice(APIView):
    def post(self, request):
        try:
            device_id = request.data.get('deviceId', None)
            device_name = request.data.get('deviceName', 'Unknown Device')  # Example: "Samsung Galaxy S21"
            device_type = request.data.get('deviceType', 'Mobile')  # Example: "Mobile", "Tablet"
            platform = request.data.get('platform', 'Android')  # Example: "Android", "iOS"
            browser = request.data.get('browser', 'Unknown Browser')
            os_version = request.data.get('osVersion', 'Unknown OS')
            screen_resolution = request.data.get('screenResolution', 'Unknown Resolution')
            ip_address = request.data.get('ipAddress', request.META.get('REMOTE_ADDR', 'Unknown IP'))  # Get IP
            if not device_id:
                return Response({"error": "Device ID is required"}, status=status.HTTP_400_BAD_REQUEST)
            

            # Here, you can store the device ID in the session or database
            request.session['device_id'] = device_id  # Store in session
            request.session['device_info'] = {
                "deviceName": device_name,
                "deviceType": device_type,
                "platform": platform,
                "browser": browser,
                "osVersion": os_version,
                "screenResolution": screen_resolution,
                "ipAddress": ip_address
            }

            return Response({"message": "Device registered successfully!",
                            "deviceInfo": {
                                        "deviceName": device_name,
                                        "deviceType": device_type,
                                        "platform": platform,
                                        "browser": browser,
                                        "osVersion": os_version,
                                        "screenResolution": screen_resolution,
                                        "ipAddress": ip_address
                                    }
                            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


        