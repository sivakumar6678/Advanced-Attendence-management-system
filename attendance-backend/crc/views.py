from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import CRCProfile
from core.models import Branch,AcademicYear
from teacher.models import AttendanceSession, Faculty
from student.models import Student, StudentAttendance, Device, DeviceReRegistrationRequest
from django.db.models import Q
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateAPIView
from .models import Timetable, TimetableEntry, Subject
from .serializers import TimetableSerializer, SubjectSerializer, DeviceReRegistrationRequestSerializer
from rest_framework import generics
from django.core.mail import send_mail
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
                "branch_id": crc.branch.id,
                "year": crc.year,
                "semester": crc.semester,
                "academic_year": f"{crc.academic_year.start_year}-{crc.academic_year.end_year}",  # ✅ Convert AcademicYear to string
                "crcId": crc.id,
                "role": "crc"
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PendingDeviceRequestsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pending_requests = DeviceReRegistrationRequest.objects.filter(status='pending')
        serializer = DeviceReRegistrationRequestSerializer(pending_requests, many=True)
        return Response(serializer.data)
class ApproveDeviceRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        crc = CRCProfile.objects.get(email=request.user.email)
        req = DeviceReRegistrationRequest.objects.get(id=pk, status='pending')

        action = request.data.get("action")  # 'approved' or 'rejected'
        if action not in ['approved', 'rejected']:
            return Response({"detail": "Invalid action"}, status=400)

        req.status = action
        req.reviewed_at = timezone.now()
        req.reviewed_by = crc
        req.save()

        if action == 'approved':
            device_data = req.new_device_info
            Device.objects.update_or_create(
                student=req.student,
                defaults=device_data
            )
            # Optionally update `student.device_id` too if needed
            req.student.device_id = device_data.get('device_id')
            req.student.save()

        return Response({"detail": f"Request {action}."})


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

class GetSubjectById(APIView):
    def get(self, request, subject_id):
        subject = get_object_or_404(Subject, id=subject_id)
        return Response({"id": subject.id, "name": subject.name}, status=status.HTTP_200_OK)


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
    def get(self, request):
        year = request.query_params.get('year')
        semester = request.query_params.get('semester')
        branch = request.query_params.get('branch')
        academic_year = request.query_params.get('academic_year')

        if not all([year, semester, branch, academic_year]):
            return Response({"error": "Missing required parameters"}, status=status.HTTP_400_BAD_REQUEST)

        timetables = Timetable.objects.filter(
            year=year,
            semester=semester,
            branch=branch,
            academic_year=academic_year
        )

        if not timetables.exists():
            return Response({"error": "No public timetable found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = TimetableSerializer(timetables, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class TimetableConfigView(APIView):
    def get(self, request):
        config = {
            "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            "time_slots": [
                "9:15 AM - 10:15 AM",
                "10:15 AM - 11:15 AM",
                "11:30 AM - 12:30 PM",
                "1:30 PM - 2:30 PM",
                "2:30 PM - 3:30 PM",
                "3:30 PM - 4:30 PM"
            ]
        }
        return Response(config)

class TimetableView(APIView):
    def get(self, request):
        # Get all required parameters from the frontend
        crc_id = request.query_params.get('crc_id')
        year = request.query_params.get('year')
        semester = request.query_params.get('semester')
        branch = request.query_params.get('branch')
        academic_year = request.query_params.get('academic_year')  # Now received from frontend

        # Validate that all required parameters are provided
        if not all([crc_id, year, semester, branch, academic_year]):
            return Response({"error": "Missing required query parameters"}, status=status.HTTP_400_BAD_REQUEST)

        # Filter timetable based on all provided parameters
        timetables = Timetable.objects.filter(
            crc_id=crc_id,
            year=year,
            semester=semester,
            branch=branch,
            academic_year=academic_year
        )

        if not timetables.exists():
            return Response({"error": "No timetable found for the given details"}, status=status.HTTP_404_NOT_FOUND)

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


class CRCClassAttendanceReportView(APIView):
    def get(self, request):
        branch_id = request.GET.get("branch")
        year = request.GET.get("year")
        semester = request.GET.get("semester")
        from_date = request.GET.get("from_date")
        to_date = request.GET.get("to_date")

        if not all([branch_id, year, semester, from_date, to_date]):
            return Response({"error": "Missing parameters"}, status=400)

        # Get students in this class
        students = Student.objects.filter(
            branch_id=branch_id,
            year=year,
            semester=semester
        ).order_by("student_id")

        if not students.exists():
            return Response({"error": "No students found"}, status=404)

        # Get subjects under this class via CRCProfile
        subjects = Subject.objects.filter(
            crc__branch_id=branch_id,
            crc__year=year,
            crc__semester=semester
        )

        subject_ids = subjects.values_list("id", flat=True)
        student_ids = students.values_list("id", flat=True)

        sessions = AttendanceSession.objects.filter(
            subject_id__in=subject_ids,
            start_time__date__range=(from_date, to_date)
        )

        session_ids = sessions.values_list("id", flat=True)

        attendance_qs = StudentAttendance.objects.filter(
            session_id__in=session_ids,
            student_id__in=student_ids
        )

        # Prepare student-wise and subject-wise attendance matrix
        attendance_data = {
            student.student_id: {
                "name": student.name,
                "attendance": [],
                "total_classes": 0,
                "total_present": 0
            }
            for student in students
        }

        for subject in subjects:
            # Get sessions for this subject
            subject_sessions = sessions.filter(subject=subject)
            session_count = subject_sessions.count()

            for student in students:
                present_count = StudentAttendance.objects.filter(
                    student=student,
                    session__in=subject_sessions,
                    status="Present"
                ).count()

                attendance_data[student.student_id]["attendance"].append({
                    "subject": subject.name,
                    "present": present_count,
                    "total": session_count,
                    "percentage": round((present_count / session_count) * 100, 2) if session_count > 0 else 0
                })

                attendance_data[student.student_id]["total_classes"] += session_count
                attendance_data[student.student_id]["total_present"] += present_count

        # Final formatting
        results = []
        for student_id, data in attendance_data.items():
            overall_percentage = (
                data["total_present"] / data["total_classes"] * 100
                if data["total_classes"] > 0 else 0
            )

            results.append({
                "student_id": student_id,
                "name": data["name"],
                "attendance": data["attendance"],
                "total_classes": data["total_classes"],
                "total_present": data["total_present"],
                "overall_percentage": round(overall_percentage, 2)
            })

        return Response({
            "students": results,
            "subjects": [s.name for s in subjects],
            "from_date": from_date,
            "to_date": to_date
        })

def calculate_attendance_percentage(student, from_date, to_date, subjects):

    total_present = 0
    total_classes = 0

    for subject in subjects:
        subject_sessions = AttendanceSession.objects.filter(
            subject=subject,
            start_time__date__range=(from_date, to_date)
        )
        session_count = subject_sessions.count()

        present_count = StudentAttendance.objects.filter(
            student=student,
            session__in=subject_sessions,
            status="Present"
        ).count()

        total_present += present_count
        total_classes += session_count

    if total_classes == 0:
        return 0
    return round((total_present / total_classes) * 100, 2)

class SendLowAttendanceEmailView(APIView):
    def post(self, request):
        branch = request.data.get('branch')
        year = request.data.get('year')
        semester = request.data.get('semester')
        from_date = request.data.get('from_date')
        to_date = request.data.get('to_date')

        # ✅ Fetch subjects related to this class
        subjects = Subject.objects.filter(
            crc__branch__id=branch,
            crc__year=year,
            crc__semester=semester
        )

        low_attendance_students = []

        for student in Student.objects.filter(branch__id=branch, year=year, semester=semester):
            overall = calculate_attendance_percentage(student, from_date, to_date, subjects)  # ✅ Now correct
            if overall < 65:
                low_attendance_students.append({
                    "name": student.name,
                    "email": student.email,
                    "percentage": overall
                })

        sent_count = 0

        for s in low_attendance_students:
            try:
                send_mail(
                    subject = '📉 Low Attendance Alert - Action Required',

message = f"""
Hi {s['name']},

We hope you're doing well. This is a gentle reminder that your current attendance stands at **{s['percentage']}%**, which is below the required minimum of 65%.

Consistent attendance is crucial for academic success and eligibility to appear in semester-end examinations. Please make sure to attend your upcoming classes regularly and reach out to your class coordinator or faculty if you need any support.

🔔 Don't wait — it's never too late to get back on track!

Best regards,  
Academic Monitoring Team  
Self Attendance Management System
""",

                    from_email=None,  # Uses DEFAULT_FROM_EMAIL if None
                    recipient_list=[s['email']],
                    fail_silently=False,
                )
                sent_count += 1
            except Exception as e:
                print(f"❌ Failed to send email to {s['email']}: {e}")

        return Response({"message": f"{sent_count} warning emails sent to students"}, status=200)


# views.py (CRC)
class PendingSubjectCompletions(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        crc = CRCProfile.objects.get(email=request.user.email)
        
        pending_subjects = Subject.objects.filter(
            crc=crc,
            status='completion_requested'
        )
        print("CRC:", crc)
        print("Subjects found:", pending_subjects.count())


        data = [{
            'id': s.id,
            'subject_name': s.name,
        } for s in pending_subjects]

        return Response(data)


class ApproveSubjectCompletion(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            subject = Subject.objects.get(pk=pk)
            if subject.status == 'completed':
                return Response({'error': 'Subject already completed.'}, status=status.HTTP_409_CONFLICT)
            subject.status = 'completed'
            subject.save()
            return Response({'message': 'Subject marked as completed successfully.'}, status=status.HTTP_200_OK)
        except Subject.DoesNotExist:
            return Response({'error': 'Subject not found.'}, status=status.HTTP_404_NOT_FOUND)
class StudentUpgradeView(APIView):
    def post(self, request):
        # Extract the academic year string (e.g., '2021-2025') from the request
        academic_year_str = request.data.get('academic_year', None)

        # Check if academic year string is provided
        if academic_year_str:
            try:
                # Split the string '2021-2025' into start_year and end_year
                start_year, end_year = map(int, academic_year_str.split('-'))
                
                # Try to fetch the AcademicYear instance
                academic_year = AcademicYear.objects.get(start_year=start_year, end_year=end_year)
            except AcademicYear.DoesNotExist:
                return Response({'error': 'Academic year not found'}, status=status.HTTP_400_BAD_REQUEST)
            except ValueError:
                return Response({'error': 'Invalid academic year format'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({'error': 'Academic year is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Process other fields (e.g., branch_id, year, semester) from the request
        branch_id = request.data.get('branch_id')
        year = request.data.get('year')
        semester = request.data.get('semester')

        # Now proceed with upgrading students for the specified academic year
        students_to_upgrade = Student.objects.filter(
            branch_id=branch_id,
            year=year,
            semester=semester,
            academic_year=academic_year
        )

        if not students_to_upgrade:
            return Response({'error': 'No students found to upgrade'}, status=status.HTTP_404_NOT_FOUND)

        # Upgrade students logic goes here, e.g., changing their year, semester, etc.
        for student in students_to_upgrade:
            # Upgrade logic (example)
            student.year += 1  # Move to the next year
            student.semester += 1  # Move to the next semester (you can modify this logic)
            student.save()

        return Response({'message': 'Students upgraded successfully'}, status=status.HTTP_200_OK)
