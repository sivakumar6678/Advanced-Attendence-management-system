from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class UserManager(BaseUserManager):
    def create_user(self, email, role=None, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")

        email = self.normalize_email(email)
        extra_fields.setdefault("is_active", True)
        user = self.model(email=email, role=role, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Create a superuser without being tied to a role"""
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser_common", True)  # ✅ Mark this as a common superuser

        return self.create_user(email=email, password=password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ("superadmin", "Super Admin"),
        ("faculty", "Faculty"),
        ("student", "Student"),
        ("crc", "CRCProfile"),
    ]

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser_common = models.BooleanField(default=False)  # ✅ New field for common superusers

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return f"{self.email} - {self.role if self.role else 'Common Superuser'}"



class SuperAdmin(models.Model):
    """Super Admin for managing faculty details."""
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)

    def __str__(self):
        return self.name


class Faculty(models.Model):
    """Faculty details added by SuperAdmin."""
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    employee_id = models.CharField(max_length=50, unique=True)
    registered = models.BooleanField(default=False)  # Only registered faculty can log in

    def __str__(self):
        return f"{self.name} - {self.email}"


class Branch(models.Model):
    name = models.CharField(max_length=100, unique=True)
    head_of_department = models.CharField(max_length=100, blank=True, null=True)  # Optional HOD field
    description = models.TextField(blank=True, null=True)  # Additional field for description

    def __str__(self):
        return self.name


class AcademicYear(models.Model):
    start_year = models.IntegerField()  # E.g., 2021
    end_year = models.IntegerField()  # E.g., 2025

    def __str__(self):
        return f"{self.start_year}-{self.end_year}"
