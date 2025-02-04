from django.urls import path
from .views import FacultyRegisterView, FacultyLoginView

urlpatterns = [
    path('register/', FacultyRegisterView.as_view(), name='faculty-register'),
    path('login/', FacultyLoginView.as_view(), name='faculty-login'),
]
