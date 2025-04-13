from django.urls import path
from .views import FacultyRegisterView, FacultyLoginView, FacultyDashboardView, FacultyAssignedSubjectsView, StartAttendanceSessionView, EndAttendanceSessionView, GetActiveAttendanceSessionView, SubjectAttendanceView, AttendanceMatrixView,RequestSubjectCompletion

urlpatterns = [
    path('register/', FacultyRegisterView.as_view(), name='faculty-register'),
    path('login/', FacultyLoginView.as_view(), name='faculty-login'),
    path('dashboard/', FacultyDashboardView.as_view(), name='faculty-dashboard'),
    path('<int:faculty_id>/assigned-subjects/', FacultyAssignedSubjectsView.as_view(), name='faculty-assigned-subjects'),
    path('start-attendance/', StartAttendanceSessionView.as_view(), name='start-attendance'),
    path('end-session/<int:session_id>/', EndAttendanceSessionView.as_view(), name='end-attendance-session'),
    path('<int:faculty_id>/active-session/', GetActiveAttendanceSessionView.as_view(), name='active-session'),
    path('subject-attendance/', SubjectAttendanceView.as_view(), name='subject-attendance'),
    path('attendance/matrix/', AttendanceMatrixView.as_view(), name='attendance-matrix'),    
    path('request-completion/<subject_id>/', RequestSubjectCompletion.as_view(), name='request-completion'),

]
