from django.db import models
from core.models import User
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager

class Faculty(User):  # Inherit from User
    full_name = models.CharField(max_length=255)
    employee_id = models.CharField(max_length=50, unique=True)
    branch = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    joined_date = models.DateField()
    exit_date = models.DateField(blank=True, null=True)
    rejoin_date = models.DateField(blank=True, null=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['employee_id']

    def __str__(self):
        return self.full_name