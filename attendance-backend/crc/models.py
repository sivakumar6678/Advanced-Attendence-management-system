from django.db import models
from core.models import User, Branch,AcademicYear
from teacher.models import Faculty  # ✅ Import Faculty model

class CRCProfile(User):  # ✅ Inherit from User for authentication
    faculty_ref = models.OneToOneField(Faculty, on_delete=models.CASCADE, related_name="crc_profile")  # ✅ Renamed
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    year = models.PositiveIntegerField(choices=[(i, f"Year {i}") for i in range(1, 5)])
    semester = models.PositiveIntegerField(choices=[(i, f"Semester {i}") for i in range(1, 3)])
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE)  # ✅ Add it back
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return f"CRC - {self.faculty_ref.email}"  # ✅ Uses linked Faculty email

class Subject(models.Model):
    name = models.CharField(max_length=255)
    crc = models.ForeignKey(CRCProfile, on_delete=models.CASCADE, related_name="subjects")

    STATUS_CHOICES = (
        ('active', 'Active'),
        ('completion_requested', 'Completion Requested'),
        ('completed', 'Completed'),
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    def __str__(self):
        return f"{self.name} - {self.crc.branch} ({self.crc.academic_year})"

class TimetableEntry(models.Model):
    day = models.CharField(max_length=10)  
    time_slot = models.CharField(max_length=50)  
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, blank=True)
    faculty = models.ForeignKey(Faculty, on_delete=models.SET_NULL, null=True, blank=True)
    is_completed = models.BooleanField(default=False)  # ✅ New field to track completion

    def __str__(self):
        return f"{self.day} - {self.time_slot}: {self.subject} ({self.faculty}) - Completed: {self.is_completed}"

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