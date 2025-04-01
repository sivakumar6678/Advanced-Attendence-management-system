from django.urls import path
from .views import RegisterStudent, LoginStudent,  StudentDashboardView, ActiveAttendanceSessionsView, MarkAttendanceView, GetAttendanceCountView,GetAttendanceHistoryView

urlpatterns = [
    path('register/', RegisterStudent.as_view(), name='register-student'),
    path('login/', LoginStudent.as_view(), name='login-student'),
    path('dashboard/', StudentDashboardView.as_view(), name='student-dashboard'),
    path('active-sessions/<str:student_id>/', ActiveAttendanceSessionsView.as_view(), name='active-sessions'),
    path('mark-attendance/', MarkAttendanceView.as_view(), name='mark-attendance'),
    path('attendance-count/<int:session_id>/', GetAttendanceCountView.as_view(), name='attendance-count'),
    path('attendance-details/<str:student_id>/', GetAttendanceHistoryView.as_view(), name='attendance-details'),
]
