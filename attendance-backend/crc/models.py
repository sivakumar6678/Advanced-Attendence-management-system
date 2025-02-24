from django.db import models
from core.models import Branch

class CRCProfile(models.Model):  # ❌ No inheritance from User
    email = models.EmailField(unique=True)  # ✅ Independent email field
    employee_id = models.CharField(max_length=20, unique=True)
    branch = models.CharField(max_length=100)
    year = models.PositiveIntegerField(choices=[(i, f"Year {i}") for i in range(1, 5)])
    semester = models.PositiveIntegerField(choices=[(i, f"Semester {i}") for i in range(1, 3)])
    password = models.CharField(max_length=255)  # ✅ Store hashed password separately

    def set_password(self, raw_password):
        """Hashes the password before saving"""
        from django.contrib.auth.hashers import make_password
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        """Checks if entered password matches hashed password"""
        from django.contrib.auth.hashers import check_password
        return check_password(raw_password, self.password)

    def __str__(self):
        return self.email  # ✅ Ensure consistent representation
