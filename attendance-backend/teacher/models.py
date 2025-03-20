from django import apps
from django.db import models
from core.models import User
from django.contrib.auth import get_user_model

class Faculty(User):  # Inherit from User
    full_name = models.CharField(max_length=255)
    employee_id = models.CharField(max_length=50, unique=True)
    branch = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    joined_date = models.DateField()
    exit_date = models.DateField(blank=True, null=True)
    rejoin_date = models.DateField(blank=True, null=True)

    # ✅ Fix: Use 'attendance.TimetableEntry' instead of 'TimetableEntry'
    assigned_subjects = models.ManyToManyField(
        'crc.Subject',  # ✅ Fix: Add correct app label for Subject
        through='crc.TimetableEntry',  # ✅ Fix: Add correct app label for TimetableEntry
        related_name='faculty_assigned'
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['employee_id']

    def __str__(self):
        return self.full_name
    
User = get_user_model()
class AttendanceSession(models.Model):
    faculty = models.ForeignKey(User, on_delete=models.CASCADE)  
    subject = models.ForeignKey("crc.Subject", on_delete=models.CASCADE)  # ✅ Lazy reference to avoid circular import
    branch = models.CharField(max_length=50)
    year = models.IntegerField()
    semester = models.IntegerField()
    modes = models.JSONField()
    session_duration = models.IntegerField()
    start_time = models.DateTimeField()
    day = models.CharField(max_length=20)
    periods = models.TextField()
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"{self.get_subject().name} - {self.day} ({self.start_time})"

    def get_subject(self):
        """✅ Get Subject instance lazily"""
        Subject = apps.get_model('crc', 'Subject')  # ✅ Lazy import of Subject
        return Subject.objects.get(id=self.subject.id)

