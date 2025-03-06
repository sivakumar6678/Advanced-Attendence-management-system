from django.db import models
from core.models import User, Branch
from teacher.models import Faculty  # ✅ Import Faculty model

class CRCProfile(User):  # ✅ Inherit from User for authentication
    faculty_ref = models.OneToOneField(Faculty, on_delete=models.CASCADE, related_name="crc_profile")  # ✅ Renamed
    branch = models.CharField(max_length=100)
    year = models.PositiveIntegerField(choices=[(i, f"Year {i}") for i in range(1, 5)])
    semester = models.PositiveIntegerField(choices=[(i, f"Semester {i}") for i in range(1, 3)])
    academic_year = models.CharField(max_length=9)  # Example: "2024-2025"
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return f"CRC - {self.faculty_ref.email}"  # ✅ Uses linked Faculty email

class Subject(models.Model):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name

class TimetableEntry(models.Model):
    day = models.CharField(max_length=10)  
    time_slot = models.CharField(max_length=50)  
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, blank=True)
    faculty = models.ForeignKey(Faculty, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.day} - {self.time_slot}: {self.subject} ({self.faculty})"

class Timetable(models.Model):
    crc = models.ForeignKey(User, on_delete=models.CASCADE, related_name="timetables")  
    branch = models.CharField(max_length=255)  
    year = models.PositiveIntegerField()  
    semester = models.PositiveIntegerField()  
    academic_year = models.CharField(max_length=9)  # Example: "2024-2025"
    entries = models.ManyToManyField(TimetableEntry, related_name='timetables')  
    is_finalized = models.BooleanField(default=False)

    def __str__(self):
        return f"Timetable for {self.branch} ({self.academic_year}) - Year {self.year} Sem {self.semester} (Finalized: {self.is_finalized})"