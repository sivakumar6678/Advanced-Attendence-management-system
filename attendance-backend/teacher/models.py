from django import apps
from django.db import models
from core.models import User
from django.contrib.auth import get_user_model
from datetime import datetime, timedelta, timezone
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
    faculty = models.ForeignKey(Faculty, on_delete=models.CASCADE)
    subject = models.ForeignKey('crc.Subject', on_delete=models.CASCADE)  # ✅ Fix: Add correct app label for Subject
    branch = models.CharField(max_length=50)
    year = models.IntegerField()
    semester = models.IntegerField()
    modes = models.JSONField()  # ["GPS", "FRS"]
    session_duration = models.IntegerField()  # In minutes
    start_time = models.DateTimeField(auto_now_add=True)  # ✅ Ensure this is a DateTimeField
    end_time = models.DateTimeField(null=True, blank=True)  # ✅ Add end_time field
    is_active = models.BooleanField(default=True)
    day = models.CharField(max_length=10)
    periods = models.JSONField()
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    def has_expired(self):
        """✅ Check if the session has expired."""
        if self.end_time and datetime.now(timezone.utc) > self.end_time:
            return True
        return False

    def save(self, *args, **kwargs):
        """✅ Set `end_time` based on `start_time` when creating a session."""
        if not self.end_time:
            self.end_time = self.start_time + timedelta(minutes=5)  # 🔥 Default to 30 mins if not provided

        if self.has_expired():
            self.is_active = False  # 🔥 Auto deactivate expired session

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.subject.name} - {self.day} ({self.start_time} to {self.end_time})"
