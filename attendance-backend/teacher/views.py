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
from student.models import Student,StudentAttendance
from django.utils.timezone import now, timedelta
from datetime import datetime, timedelta, timezone
from django.db.models import Count, Q
from .models import AttendanceSession

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

        # ✅ Ensure Faculty and Subject exist
        try:
            faculty = Faculty.objects.get(id=faculty_id)
            subject = Subject.objects.get(id=subject_id)
        except (Faculty.DoesNotExist, Subject.DoesNotExist):
            return Response({"error": "Invalid Faculty or Subject"}, status=status.HTTP_404_NOT_FOUND)

        session_duration = data.get("session_duration")
        if not session_duration:
            return Response({"error": "Session duration is required"}, status=status.HTTP_400_BAD_REQUEST)

        # ✅ Mark expired sessions as inactive
        AttendanceSession.objects.filter(is_active=True, end_time__lte=now()).update(is_active=False)

        # ✅ Calculate session end time
        start_time = datetime.now()  # ✅ Set start time
        end_time = start_time + timedelta(minutes=session_duration)  # ✅ Use dynamic session duration

        # ✅ Create and save new attendance session
        attendance_session = AttendanceSession.objects.create(
            faculty=faculty,
            subject=subject,
            branch=data.get("branch"),
            year=data.get("year"),
            semester=data.get("semester"),
            modes=data.get("modes"),
            session_duration=session_duration,
            start_time=start_time,
            end_time=end_time,  # ✅ Add end_time
            day=data.get("day"),
            periods=data.get("periods"),
            latitude=data.get("latitude"),
            longitude=data.get("longitude"),
            is_active=True  # ✅ Mark session as active
        )

        return Response({
            "message": "Attendance session started successfully!",
            "session_id": attendance_session.id,
            "end_time": attendance_session.end_time.isoformat()  # ✅ Return end time
        }, status=status.HTTP_201_CREATED)

class EndAttendanceSessionView(APIView):
    def post(self, request, session_id):  # ✅ Receive session_id from URL
        try:
            session = AttendanceSession.objects.get(id=session_id, is_active=True)

            # ✅ Get the subject assigned to this session
            subject = session.subject

            # ✅ Fetch academic details from CRCProfile
            crc = subject.crc  # ✅ Get CRCProfile linked to the subject

            # ✅ Step 1: Find all students in the same academic structure as this subject
            registered_students = Student.objects.filter(
                academic_year=crc.academic_year, 
                branch=crc.branch, 
                year=crc.year, 
                semester=crc.semester
            )

            # ✅ Step 2: Get students who were already marked present
            marked_students = StudentAttendance.objects.filter(session=session).values_list('student_id', flat=True)

            # ✅ Step 3: Find students who were NOT marked (unmarked = absent)
            absent_students = registered_students.exclude(id__in=marked_students)

            # ✅ Step 4: Mark them as absent
            for student in absent_students:
                StudentAttendance.objects.create(
                    student=student,
                    session=session,
                    status="Absent",  # Assuming 'status' field exists in Attendance model
                    timestamp=datetime.now()
                )

            # ✅ Step 5: Mark session as inactive
            session.is_active = False
            session.end_time = datetime.now()
            session.save()

            return Response({"message": "Attendance session ended, absent students marked."}, status=status.HTTP_200_OK)

        except AttendanceSession.DoesNotExist:
            return Response({"error": "Session not found or already ended"}, status=status.HTTP_404_NOT_FOUND)



class GetActiveAttendanceSessionView(APIView):
    def get(self, request, faculty_id):
        """✅ Fetch the active session for a faculty if it exists."""
        try:
            faculty = Faculty.objects.get(id=faculty_id)
        except Faculty.DoesNotExist:
            return Response({"error": "Faculty not found"}, status=status.HTTP_404_NOT_FOUND)

        # ✅ Get active session for faculty
        active_session = AttendanceSession.objects.filter(faculty=faculty, is_active=True, end_time__gt=now()).first()

        if not active_session:
            return Response({"message": "No active session"}, status=status.HTTP_200_OK)

        return Response({
            "session_id": active_session.id,
            "subject_name": active_session.subject.name,
            "start_time": active_session.start_time,
            "end_time": active_session.end_time,
            "is_active": active_session.is_active
        }, status=status.HTTP_200_OK)



class SubjectAttendanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        subject_id = request.GET.get('subject_id')
        from_date = request.GET.get('from_date')
        to_date = request.GET.get('to_date')

        if not subject_id:
            return Response({"error": "subject_id is required"}, status=400)

        try:
            subject = Subject.objects.get(id=subject_id)
        except Subject.DoesNotExist:
            return Response({"error": "Subject not found"}, status=404)

        # Ensure current faculty is teaching this subject
        faculty = Faculty.objects.get(user_ptr=request.user)
        if not faculty.assigned_subjects.filter(id=subject.id).exists():
            return Response({"error": "Unauthorized access to this subject"}, status=403)

        # Filter sessions by this subject and this faculty
        sessions = AttendanceSession.objects.filter(
            faculty=faculty,
            subject=subject
        )

        # Filter sessions by date range
        if from_date and to_date:
            try:
                from_dt = datetime.strptime(from_date, "%Y-%m-%d")
                to_dt = datetime.strptime(to_date, "%Y-%m-%d")
                sessions = sessions.filter(start_time__date__range=(from_dt, to_dt))
            except ValueError:
                return Response({"error": "Invalid date format. Use YYYY-MM-DD."}, status=400)

        session_ids = sessions.values_list('id', flat=True)

        # Get attendance grouped by student
        student_attendance = StudentAttendance.objects.filter(
            session_id__in=session_ids
        ).values('student__id', 'student__name').annotate(
            total_classes=Count('id'),
            present=Count('id', filter=Q(status='Present')),
            absent=Count('id', filter=Q(status='Absent'))
        )

        # Add attendance % calculation
        result = []
        for entry in student_attendance:
            total = entry['total_classes']
            present = entry['present']
            percentage = (present / total) * 100 if total > 0 else 0
            result.append({
                'student_id': entry['student__id'],
                'student_name': entry['student__name'],
                'total_classes': total,
                'present': present,
                'absent': entry['absent'],
                'attendance_percentage': round(percentage, 2)
            })

        return Response(result)

class AttendanceMatrixView(APIView):
    def get(self, request):
        subject_id = request.GET.get("subject_id")
        start_date = request.GET.get("start_date")
        end_date = request.GET.get("end_date")

        if not (subject_id and start_date and end_date):
            return Response({"error": "Missing parameters"}, status=400)

        sessions = AttendanceSession.objects.filter(
            subject_id=subject_id,
            start_time__date__range=(start_date, end_date)
        ).order_by("start_time")

        if not sessions.exists():
            return Response({"headers": [], "students": []})  # No data found

        session_headers = [
            {
                "session_id": s.id,
                "date": s.start_time.strftime("%Y-%m-%d"),
                "time": f"{s.start_time.strftime('%H:%M')} - {s.end_time.strftime('%H:%M')}"
            }
            for s in sessions
        ]

        reference_session = sessions.first()
        students = Student.objects.filter(
            branch__name=reference_session.branch,
            year=reference_session.year,
            semester=reference_session.semester
        ).order_by("student_id")

        student_data = []
        for student in students:
            attendance_map = {}
            present_count = 0
            for session in sessions:
                attendance = StudentAttendance.objects.filter(
                    student=student, session=session
                ).first()
                status_text = attendance.status if attendance else "Absent"
                attendance_map[str(session.id)] = status_text
                if status_text == "Present":
                    present_count += 1

            total_sessions = sessions.count()
            percent = (present_count / total_sessions) * 100 if total_sessions > 0 else 0

            student_data.append({
                "student_id": student.id,
                "roll_no": student.student_id,
                "name": student.name,
                "attendance": attendance_map,
                "present": present_count,
                "total": total_sessions,
                "percentage": round(percent, 2)
            })

        return Response({
            "headers": session_headers,
            "students": student_data
        })

    def post(self, request):
        updates = request.data.get("updates", [])
        for item in updates:
            student_id = item.get("student_id")
            session_id = item.get("session_id")
            status_val = item.get("status")

            if student_id and session_id and status_val:
                StudentAttendance.objects.update_or_create(
                    student_id=student_id,
                    session_id=session_id,
                    defaults={"status": status_val}
                )

        return Response({"message": "Attendance updated successfully!"}, status=status.HTTP_200_OK)


# views.py (Teacher View)

class RequestSubjectCompletion(APIView):
    def post(self, request, subject_id):
        # Fetch the subject allocation
        try:
            subject = Subject.objects.get(id=subject_id)
        except Subject.DoesNotExist:
            return Response({"error": "Subject not found"}, status=status.HTTP_404_NOT_FOUND)

        # Check if the subject is already completed
        if subject.status == 'completed':
            return Response({"error": "Subject is already completed"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Update status to "completion_requested"
        subject.status = 'completion_requested'
        subject.save()

        return Response({"message": "Subject completion requested"}, status=status.HTTP_200_OK)
