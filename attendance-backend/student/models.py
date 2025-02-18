from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.core.validators import RegexValidator
from core.models import Branch, AcademicYear

class StudentManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field is required")
        email = self.normalize_email(email)
        student = self.model(email=email, **extra_fields)
        student.set_password(password)
        student.save(using=self._db)
        return student

class Student(AbstractBaseUser):
    student_id = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    year = models.PositiveIntegerField(choices=[(i, f"Year {i}") for i in range(1, 5)])
    semester = models.PositiveIntegerField(choices=[(i, f"Semester {i}") for i in range(1, 3)])
    phone_number = models.CharField(
        max_length=15, validators=[RegexValidator(regex=r'^\+?\d{10,15}$', message="Enter a valid phone number")]
    )
    parent_phone_number = models.CharField(
        max_length=15, validators=[RegexValidator(regex=r'^\+?\d{10,15}$', message="Enter a valid phone number")]
    )
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE)
    is_lateral_entry = models.BooleanField(default=False)
    face_descriptor = models.JSONField()
    device_id = models.CharField(max_length=255, unique=True, null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['student_id', 'name', 'year', 'semester']

    objects = StudentManager()

    def __str__(self):
        return self.name


class Device(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="devices")
    fingerprint = models.CharField(max_length=255, unique=True)  # Unique device identifier
    user_agent = models.TextField()
    ip_address = models.GenericIPAddressField()
    registered_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Device for {self.student.name} - {self.fingerprint}"
