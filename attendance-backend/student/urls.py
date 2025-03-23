from django.urls import path
from .views import RegisterStudent, LoginStudent,  StudentDashboardView, ActiveAttendanceSessionsView, MarkAttendanceView

urlpatterns = [
    path('register/', RegisterStudent.as_view(), name='register-student'),
    path('login/', LoginStudent.as_view(), name='login-student'),
    path('dashboard/', StudentDashboardView.as_view(), name='student-dashboard'),
    path('active-sessions/<str:student_id>/', ActiveAttendanceSessionsView.as_view(), name='active-sessions'),
    path('mark-attendance/', MarkAttendanceView.as_view(), name='mark-attendance'),
]
