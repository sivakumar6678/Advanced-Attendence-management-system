from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import CRC
from django.contrib.auth import authenticate
from django.db.utils import IntegrityError
from teacher.models import Faculty

class LoginCRC(APIView):
    def post(self, request):
        crc_data = request.data
        email = crc_data.get('email', '').strip()
        password = crc_data.get('password', '').strip()

        if not email or not password:
            return Response({"error": "Email and password are required"}, status=status.HTTP_400_BAD_REQUEST)

        # Find CRC by email
        crc = CRC.objects.filter(email=email).first()

        if crc and crc.check_password(password):
            return Response({"message": "Login successful"}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid email or password"}, status=status.HTTP_401_UNAUTHORIZED)

class RegisterCRC(APIView):
    def post(self, request):
        try:
            crc_data = request.data
            email = crc_data.get('email', '').strip()

            # Check if the email belongs to a registered teacher
            teacher = Faculty.objects.filter(email=email).first()
            if not teacher:
                return Response({"error": "Only registered teachers can become CRC"}, status=status.HTTP_403_FORBIDDEN)

            # Create CRC if teacher exists
            crc = CRC.objects.create(
                crc_id=crc_data['crcId'],
                name=crc_data['name'],
                email=email,
                phone_number=crc_data['phoneNumber'],
                branch_id=crc_data['branch'],
            )
            crc.set_password(crc_data['password'])  # Hash password
            crc.save()

            return Response({"message": "CRC registered successfully!"}, status=status.HTTP_201_CREATED)

        except IntegrityError:
            return Response({"error": "CRC with this email or ID already exists"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)