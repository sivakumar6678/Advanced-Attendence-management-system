from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import IntegrityError
from .models import Student, Device
from core.models import Branch, AcademicYear

class RegisterStudent(APIView):
    def post(self, request, *args, **kwargs):
        try:
            student_data = request.data
            face_descriptor = student_data.get('faceDescriptor', None)
            # device_id = student_data.get('deviceId', None)  # Get device ID

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
                device_id = student_data['deviceId']
                # device_id=device_id  # Store device ID

            )

            student.set_password(student_data['password'])
            student.save()

            return Response({"message": "Student registered successfully!"}, status=status.HTTP_201_CREATED)
        except IntegrityError:
            return Response({"error": "Student ID or Email already exists"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
class RegisterDevice(APIView):
    def post(self, request):
        try:
            device_id = request.data.get('deviceId', None)
            if not device_id:
                return Response({"error": "Device ID is required"}, status=status.HTTP_400_BAD_REQUEST)

            # Here, you can store the device ID in the session or database
            request.session['device_id'] = device_id  # Store in session

            return Response({"message": "Device registered successfully!"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LoginStudent(APIView):
    def post(self, request):
        student_data = request.data
        identifier = student_data.get('studentIdOrEmail', '').strip()
        password = student_data.get('password', '').strip()
        device_id = student_data.get('deviceId', '')  # Get device ID

        if not identifier or not password:
            return Response({"error": "Student ID/Email and password are required"}, status=status.HTTP_400_BAD_REQUEST)

        # Fetch student using email or student ID
        student = Student.objects.filter(email=identifier).first() or Student.objects.filter(student_id=identifier).first()

        if student:
            if not student.device_id:
                # First-time login on a new device - register this device
                student.device_id = device_id
                student.save()
                return Response({"message": "Device registered. Login successful."}, status=status.HTTP_200_OK)

            if student.check_password(password):
                if student.device_id == device_id:
                    return Response({"message": "Login successful"}, status=status.HTTP_200_OK)
                else:
                    return Response({"error": "Unauthorized device. Please use your registered device or contact admin."}, status=status.HTTP_401_UNAUTHORIZED)
        