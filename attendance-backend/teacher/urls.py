from django.urls import path
from .views import FacultyRegisterView, FacultyLoginView, FacultyDashboardView, FacultyAssignedSubjectsView, StartAttendanceSessionView, EndAttendanceSessionView

urlpatterns = [
    path('register/', FacultyRegisterView.as_view(), name='faculty-register'),
    path('login/', FacultyLoginView.as_view(), name='faculty-login'),
    path('dashboard/', FacultyDashboardView.as_view(), name='faculty-dashboard'),
    path('<int:faculty_id>/assigned-subjects/', FacultyAssignedSubjectsView.as_view(), name='faculty-assigned-subjects'),
    path('start-attendance/', StartAttendanceSessionView.as_view(), name='start-attendance'),
    path('end-session/<int:session_id>/', EndAttendanceSessionView.as_view(), name='end-attendance-session'),

]
