from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.validators import RegexValidator
from core.models import Branch, AcademicYear,User
from teacher.models import AttendanceSession
from crc.models import CRCProfile

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
    is_graduated = models.BooleanField(default=False)


    USERNAME_FIELD = 'email'  # ✅ Set email as the username
    REQUIRED_FIELDS = ['student_id', 'name', 'year', 'semester']


    def __str__(self):
        return self.name



class Device(models.Model):
    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name='device')
    device_id = models.CharField(max_length=255, unique=True)
    device_name = models.CharField(max_length=255, null=True, blank=True)
    device_type = models.CharField(max_length=50, null=True, blank=True)
    platform = models.CharField(max_length=50, null=True, blank=True)
    browser = models.CharField(max_length=50, null=True, blank=True)
    os_version = models.CharField(max_length=50, null=True, blank=True)
    screen_resolution = models.CharField(max_length=50, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    def __str__(self):
        return f"{self.student.name} - {self.device_name}"
    
class DeviceReRegistrationRequest(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    reason = models.TextField()
    new_device_info = models.JSONField()  # temp store new device data
    status = models.CharField(
        max_length=20,
        choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')],
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(CRCProfile, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.student.name} - {self.status}"

class StudentAttendance(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    session = models.ForeignKey(AttendanceSession, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
    period = models.CharField(max_length=50)  # ✅ Store period as string (e.g., "2:30 PM - 3:30 PM")
    status = models.CharField(max_length=10, choices=[("Present", "Present"), ("Absent", "Absent")])
    
    class Meta:
        unique_together = ('student', 'session')  # ✅ Prevent duplicate attendance

    def __str__(self):
        return f"{self.student.name} - {self.session.subject.name} - {self.status}"


