from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.validators import RegexValidator
from core.models import Branch, AcademicYear,User

class Student(User):  # Inherit from User
    name = models.CharField(max_length=100)
    student_id = models.CharField(max_length=20, unique=True)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    year = models.PositiveIntegerField(choices=[(i, f"Year {i}") for i in range(1, 5)])
    semester = models.PositiveIntegerField(choices=[(i, f"Semester {i}") for i in range(1, 3)])
    phone_number = models.CharField(max_length=15)
    parent_phone_number = models.CharField(max_length=15)
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE)
    is_lateral_entry = models.BooleanField(default=False)
    face_descriptor = models.JSONField()
    device_id = models.CharField(max_length=255, unique=True, null=True, blank=True)

    USERNAME_FIELD = 'email'  # ✅ Set email as the username
    REQUIRED_FIELDS = ['student_id', 'name', 'year', 'semester']


    def __str__(self):
        return self.name



class Device(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="devices")
    fingerprint = models.CharField(max_length=255, unique=True)  # Unique device identifier
    user_agent = models.TextField()
    ip_address = models.GenericIPAddressField()
    registered_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Device for {self.student.name} - {self.fingerprint}"
