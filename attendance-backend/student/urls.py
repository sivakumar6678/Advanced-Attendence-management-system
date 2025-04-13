from django.urls import path
from .views import RegisterStudent, LoginStudent,  StudentDashboardView, ActiveAttendanceSessionsView, MarkAttendanceView, GetAttendanceCountView,GetAttendanceHistoryView, NotifyStreakLossView, RequestDeviceReRegistrationView, SendOtpToEmailView, VerifyOtpView
urlpatterns = [
    path('register/', RegisterStudent.as_view(), name='register-student'),
    path('login/', LoginStudent.as_view(), name='login-student'),
    path('dashboard/', StudentDashboardView.as_view(), name='student-dashboard'),
    path('active-sessions/<str:student_id>/', ActiveAttendanceSessionsView.as_view(), name='active-sessions'),
    path('mark-attendance/', MarkAttendanceView.as_view(), name='mark-attendance'),
    path('attendance-count/<int:session_id>/', GetAttendanceCountView.as_view(), name='attendance-count'),
    path('attendance-details/<str:student_id>/', GetAttendanceHistoryView.as_view(), name='attendance-details'),
    path("notify-streak-loss/", NotifyStreakLossView.as_view(), name="notify-streak-loss"),
    path('device-re-registration/', RequestDeviceReRegistrationView.as_view(), name='device-re-registration'),
    path('send-otp-to-email/', SendOtpToEmailView.as_view(), name='send_otp_email'),
    path('verify-otp/', VerifyOtpView.as_view(), name='verify_otp'),
]
