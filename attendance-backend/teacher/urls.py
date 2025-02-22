from django.urls import path
from .views import FacultyRegisterView, FacultyLoginView, FacultyDashboardView

urlpatterns = [
    path('register/', FacultyRegisterView.as_view(), name='faculty-register'),
    path('login/', FacultyLoginView.as_view(), name='faculty-login'),
    path('dashboard/', FacultyDashboardView.as_view(), name='faculty-dashboard'),
]
