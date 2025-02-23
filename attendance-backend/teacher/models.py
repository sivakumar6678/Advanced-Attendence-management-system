from django.db import models
from core.models import User
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager

# class FacultyManager(BaseUserManager):
#     def create_user(self, email, employee_id, password=None, **extra_fields):
#         if not email:
#             raise ValueError("Email is required")
#         if not employee_id:
#             raise ValueError("Employee ID is required")

#         email = self.normalize_email(email)
#         faculty = self.model(email=email, employee_id=employee_id, **extra_fields)
#         faculty.set_password(password)  # ✅ Hash password
#         faculty.save(using=self._db)
#         return faculty

#     def create_superuser(self, email, employee_id, password=None, **extra_fields):
#         extra_fields.setdefault('is_admin', True)
#         return self.create_user(email, employee_id, password, **extra_fields)

# class Faculty(AbstractBaseUser):
#     full_name = models.CharField(max_length=255)
#     email = models.EmailField(unique=True)
#     branch = models.CharField(max_length=100)
#     phone_number = models.CharField(max_length=15, blank=True, null=True)
#     password = models.CharField(max_length=255)  # ✅ Ensure password is stored
#     employee_id = models.CharField(max_length=50, unique=True)
#     joined_date = models.DateField()
#     exit_date = models.DateField(blank=True, null=True)
#     rejoin_date = models.DateField(blank=True, null=True)

#     is_active = models.BooleanField(default=True)
#     is_admin = models.BooleanField(default=False)

#     USERNAME_FIELD = 'email'
#     REQUIRED_FIELDS = ['employee_id']

#     objects = FacultyManager()

#     def __str__(self):
#         return self.full_name
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