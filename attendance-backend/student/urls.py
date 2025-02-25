from django.urls import path
from .views import RegisterStudent, LoginStudent,  StudentDashboardView

urlpatterns = [
    path('register/', RegisterStudent.as_view(), name='register-student'),
    path('login/', LoginStudent.as_view(), name='login-student'),
    path('dashboard/', StudentDashboardView.as_view(), name='student-dashboard'),
    # path('student/<int:pk>/', StudentDetailView.as_view(), name='student_detail'),
]
