import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import CRCProfile
from core.models import Branch,AcademicYear
from teacher.models import Faculty
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateAPIView
from .models import Timetable, TimetableEntry, Subject
from .serializers import TimetableSerializer, SubjectSerializer
from rest_framework import generics
class RegisterCRC(APIView):
    def post(self, request):
        data = request.data
        email = data.get("email")
        employee_id = data.get("employee_id")
        branch_id = data.get("branch")
        year = data.get("year")
        semester = data.get("semester")
        academic_year_id = data.get("academic_year_id")  # ✅ Use ID for academic year
        password = data.get("password")  # ✅ Ensure password is provided

        # ✅ Fetch the existing Faculty (User) instance
        faculty = get_object_or_404(Faculty, email=email, employee_id=employee_id)

        # ✅ Ensure CRC is not already registered
        if CRCProfile.objects.filter(faculty_ref=faculty).exists():
            return Response({"error": "CRC already registered for this faculty"}, status=status.HTTP_400_BAD_REQUEST)

        # ✅ Fetch Branch and Academic Year by ID
        branch = get_object_or_404(Branch, id=branch_id)
        academic_year = get_object_or_404(AcademicYear, id=academic_year_id)

        # ✅ Create or Update CRCProfile without modifying Faculty directly
        crc_user, created = CRCProfile.objects.update_or_create(
            id=faculty.id,  # ✅ Use Faculty's existing User ID
            defaults={
                "email": faculty.email,
                "faculty_ref": faculty,
                "branch": branch,
                "year": year,
                "semester": semester,
                "academic_year": academic_year,
            }
        )

        # ✅ If a new CRCProfile was created, set and hash the password
        if created:
            crc_user.set_password(password)  # 🔒 Ensure password is securely hashed
            crc_user.save()

        return Response(
            {"message": "CRC registered successfully!", "created": created},
            status=status.HTTP_201_CREATED
        )



class LoginCRC(APIView):
    def post(self, request):
        data = request.data
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return Response({"error": "Email and password are required"}, status=status.HTTP_400_BAD_REQUEST)

        # ✅ Find Faculty first
        faculty = get_object_or_404(Faculty, email=email)

        if faculty.check_password(password):  # ✅ Use Faculty's password
            # ✅ Generate JWT Token for authentication
            refresh = RefreshToken.for_user(faculty)  
            access_token = str(refresh.access_token)

            # ✅ Check if CRC is linked to Faculty
            crc = get_object_or_404(CRCProfile, faculty_ref=faculty)

            return Response({
                "message": "Login successful",
                "access_token": access_token,
                "refresh_token": str(refresh),
                "faculty_id": faculty.id,
                "email": faculty.email,
                "role": "crc",
                "user_id": crc.id,
                "academic_year": f"{crc.academic_year.start_year}-{crc.academic_year.end_year}",  # ✅ Convert to string
            }, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid password"}, status=status.HTTP_401_UNAUTHORIZED)

class CRCDashboardView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user  # ✅ Get authenticated user
            faculty = get_object_or_404(Faculty, email=user.email)  # ✅ Find Faculty

            # ✅ Fetch CRC profile using Faculty reference
            crc = get_object_or_404(CRCProfile, faculty_ref=faculty)

            return Response({
                "faculty_id": crc.faculty_ref.id,
                "email": crc.faculty_ref.email,
                "branch": crc.branch.name,  # ✅ Convert Branch object to a string
                "year": crc.year,
                "semester": crc.semester,
                "academic_year": f"{crc.academic_year.start_year}-{crc.academic_year.end_year}",  # ✅ Convert AcademicYear to string
                "crcId": crc.id,
                "role": "crc"
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


class GetFaculty(APIView):
    def get(self, request):
        faculty = Faculty.objects.all()
        faculty_list = []
        


        if faculty:
            for member in faculty:
                faculty_list.append({
                    "id": member.id,

                    "full_name": member.full_name,
                    "email": member.email
                })
            return Response(faculty_list, status=status.HTTP_200_OK)

# Get all subjects & create a new subject
class SubjectListCreateView(generics.ListCreateAPIView):
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated]  # ✅ Ensure only authenticated CRC can manage subjects

    def get_queryset(self):
        user = self.request.user
        crc = get_object_or_404(CRCProfile, faculty_ref=user)
        return Subject.objects.filter(crc=crc)

    def perform_create(self, serializer):
        user = self.request.user
        crc = get_object_or_404(CRCProfile, faculty_ref=user)
        serializer.save(crc=crc)
# Delete a subject
class SubjectDeleteView(APIView):
    def delete(self, request, subject_id):
        try:
            subject = Subject.objects.get(id=subject_id)
            subject.delete()
            return Response({"message": "Subject deleted successfully"}, status=status.HTTP_200_OK)
        except Subject.DoesNotExist:
            return Response({"error": "Subject not found"}, status=status.HTTP_404_NOT_FOUND)

class PublicTimetableView(APIView):
    """✅ Public endpoint for fetching timetables (No authentication required)"""
    
    def get(self, request):
        timetables = Timetable.objects.all()
        serializer = TimetableSerializer(timetables, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
class TimetableView(APIView):
    def get(self, request):
        current_year = datetime.datetime.now().year
        academic_year = f"{current_year}-{current_year + 1}"  # Example: "2024-2025"
        
        
        timetables = Timetable.objects.filter(academic_year=academic_year)
        serializer = TimetableSerializer(timetables, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = TimetableSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
class FinalizeTimetableView(APIView):
    def put(self, request, timetable_id):
        timetable = get_object_or_404(Timetable, id=timetable_id)
        timetable.is_finalized = True
        timetable.save()
        return Response({"message": "Timetable finalized successfully"}, status=status.HTTP_200_OK)

