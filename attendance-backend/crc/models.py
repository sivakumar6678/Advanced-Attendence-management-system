import uuid
from django.db import models
from core.models import Branch,User

class CRC(User):  # ✅ Now CRC inherits from User
    employee_id = models.CharField(max_length=20, unique=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    year = models.PositiveIntegerField(choices=[(i, f"Year {i}") for i in range(1, 5)])
    semester = models.PositiveIntegerField(choices=[(i, f"Semester {i}") for i in range(1, 3)])
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['employee_id', 'branch', 'year', 'semester']

    def __str__(self):
        return f"CRC - {self.email}"