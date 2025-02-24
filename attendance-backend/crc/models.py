from django.db import models
from core.models import User, Branch
from teacher.models import Faculty  # ✅ Import Faculty model

class CRCProfile(User):  # ✅ Inherit from User for authentication
    faculty_ref = models.OneToOneField(Faculty, on_delete=models.CASCADE, related_name="crc_profile")  # ✅ Renamed
    branch = models.CharField(max_length=100)
    year = models.PositiveIntegerField(choices=[(i, f"Year {i}") for i in range(1, 5)])
    semester = models.PositiveIntegerField(choices=[(i, f"Semester {i}") for i in range(1, 3)])

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return f"CRC - {self.faculty_ref.email}"  # ✅ Uses linked Faculty email
