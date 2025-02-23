from django.db import models
from core.models import User, Branch  # ✅ Keep CRC as a Django user

class CRCProfile(models.Model):  # ✅ Separate table for CRC-specific data
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="crc_profile")
    employee_id = models.CharField(max_length=20, unique=True)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    year = models.PositiveIntegerField(choices=[(i, f"Year {i}") for i in range(1, 5)])
    semester = models.PositiveIntegerField(choices=[(i, f"Semester {i}") for i in range(1, 3)])

    def __str__(self):
        return f"CRC - {self.user.email}"
