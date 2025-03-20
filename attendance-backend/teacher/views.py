from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.hashers import make_password, check_password
from rest_framework_simplejwt.tokens import RefreshToken
from core.models import Faculty as CoreFaculty  # Reference faculty added by SuperAdmin
from .models import Faculty,AttendanceSession
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from crc.models import Subject,Timetable,TimetableEntry
from crc.serializers import SubjectSerializer
from django.utils.timezone import now

class FacultyRegisterView(APIView):
    def post(self, request):
        data = request.data
        email = data.get('email')
        employee_id = data.get('employeeId')  # Match frontend field name
        full_name = data.get('fullName')
        branch = data.get('branch')
        phone_number = data.get('phoneNumber', None)
        password = data.get('password')
        joined_date = data.get('joinedDate')

        # Validate required fields
        if not email or not employee_id or not full_name or not branch or not password or not joined_date:
            return Response({"error": "All required fields must be provided"}, status=status.HTTP_400_BAD_REQUEST)

        # Check if faculty is pre-added by SuperAdmin
        try:
            core_faculty = CoreFaculty.objects.get(email=email, employee_id=employee_id)
        except CoreFaculty.DoesNotExist:
            return Response({"error": "Faculty details not found. Contact SuperAdmin."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if faculty is already registered
        if Faculty.objects.filter(email=email).exists():
            return Response({"error": "Faculty already registered"}, status=status.HTTP_400_BAD_REQUEST)

        # Register faculty
        faculty = Faculty.objects.create(
            full_name=full_name,
            email=email,
            branch=branch,
            phone_number=phone_number,
            employee_id=employee_id,
            joined_date=joined_date,
        )
        faculty.set_password(password)  # ✅ Use Django's built-in password hashing
        faculty.save()

        
        # Update registered status in core app
        core_faculty.registered = True
        core_faculty.save()

        return Response({"message": "Registration successful"}, status=status.HTTP_201_CREATED)


class FacultyLoginView(APIView):
    def post(self, request):
        data = request.data
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return Response({"error": "Email and password are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            faculty = Faculty.objects.get(email=email)

            # Check password using Django's password checking function
            # if check_password(password, faculty.password):
            if faculty.check_password(password):  # ✅ Use Django's built-in password check
                refresh = RefreshToken.for_user(faculty)  # Generate JWT token
                return Response({
                    "message": "Login successful",
                    "access_token": str(refresh.access_token),
                    "refresh_token": str(refresh)
                }, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Invalid password"}, status=status.HTTP_401_UNAUTHORIZED)

        except Faculty.DoesNotExist:
            return Response({"error": "Faculty not found"}, status=status.HTTP_404_NOT_FOUND)

class FacultyDashboardView(APIView):

    authentication_classes = [JWTAuthentication]  # Use JWT authentication
    permission_classes = [IsAuthenticated]  # Only authenticated users can access

    def get(self, request):
        try:
            # Extract faculty ID from JWT token
            user = request.user  

            # Fetch faculty details
            faculty = Faculty.objects.get(id=user.id)

            # Return faculty details
            return Response({
                "id":faculty.id,
                "full_name": faculty.full_name,
                "email": faculty.email,
                "branch": faculty.branch,
                "phone_number": faculty.phone_number,
                "joined_date": faculty.joined_date
            }, status=status.HTTP_200_OK)

        except Faculty.DoesNotExist:
            return Response({"error": "Faculty not found"}, status=status.HTTP_404_NOT_FOUND)
        

class FacultyAssignedSubjectsView(APIView):
    def get(self, request, faculty_id):
        try:
            faculty = Faculty.objects.get(id=faculty_id)  # ✅ Get faculty instance
            
            # ✅ Get all timetable entries where faculty is assigned
            timetable_entries = TimetableEntry.objects.filter(faculty=faculty).select_related('subject')

            if not timetable_entries.exists():
                return Response({"message": "No assigned subjects found"}, status=status.HTTP_200_OK)

            assigned_subjects = []
            for entry in timetable_entries:
                timetable = Timetable.objects.filter(entries=entry).first()  # ✅ Get related Timetable
                
                if timetable:
                    assigned_subjects.append({
                        "subject_id": entry.subject.id if entry.subject else None,
                        "subject_name": entry.subject.name if entry.subject else "Unknown",
                        "crc_id": timetable.crc_id,  # ✅ Get CRC ID from Timetable
                        "year": timetable.year,
                        "semester": timetable.semester,
                        "branch": timetable.branch,
                        "academic_year": timetable.academic_year
                    })

            return Response(assigned_subjects, status=status.HTTP_200_OK)

        except Faculty.DoesNotExist:
            return Response({"error": "Faculty not found"}, status=status.HTTP_404_NOT_FOUND)
        

class StartAttendanceSessionView(APIView):
    def post(self, request):
        data = request.data
        faculty_id = data.get('faculty_id')
        subject_id = data.get('subject_id')

        # ✅ Ensure Faculty exists
        try:
            faculty = Faculty.objects.get(id=faculty_id)
        except Faculty.DoesNotExist:
            return Response({"error": "Faculty not found"}, status=status.HTTP_404_NOT_FOUND)

        # ✅ Ensure Subject exists
        try:
            subject = Subject.objects.get(id=subject_id)
        except Subject.DoesNotExist:
            return Response({"error": "Subject not found"}, status=status.HTTP_404_NOT_FOUND)

        # ✅ Mock response (Replace with actual attendance logic)
        return Response({
            "message": "Attendance session started successfully!",
            "faculty_id": faculty.id,
            "subject_id": subject.id,
            "branch": data.get("branch"),
            "year": data.get("year"),
            "semester": data.get("semester"),
            "modes": data.get("modes"),
            "session_duration": data.get("session_duration"),
            "start_time": data.get("start_time"),
            "day": data.get("day"),
            "periods": data.get("periods"),
            "latitude": data.get("latitude"),
            "longitude": data.get("longitude"),
        }, status=status.HTTP_200_OK)