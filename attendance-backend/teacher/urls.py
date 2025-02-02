from django.urls import path
from .views import register_faculty, faculty_login

urlpatterns = [
    path("register/", register_faculty, name="register_faculty"),
    path("login/", faculty_login, name="faculty_login"),
]
