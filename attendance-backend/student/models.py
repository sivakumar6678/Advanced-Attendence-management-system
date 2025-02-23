from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.validators import RegexValidator
from core.models import Branch, AcademicYear,User

# class StudentManager(BaseUserManager):
#     def create_user(self, email, password=None, **extra_fields):
#         if not email:
#             raise ValueError("The Email field is required")
#         email = self.normalize_email(email)
#         student = self.model(email=email, **extra_fields)
#         student.set_password(password)
#         student.save(using=self._db)
#         return student

class Student(User):  # Inherit from User
    name = models.CharField(max_length=100)
    student_id = models.CharField(max_length=20, unique=True)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    year = models.PositiveIntegerField(choices=[(i, f"Year {i}") for i in range(1, 5)])
    semester = models.PositiveIntegerField(choices=[(i, f"Semester {i}") for i in range(1, 3)])
    phone_number = models.CharField(max_length=15)
    parent_phone_number = models.CharField(max_length=15)
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE)
    is_lateral_entry = models.BooleanField(default=False)
    face_descriptor = models.JSONField()
    device_id = models.CharField(max_length=255, unique=True, null=True, blank=True)

    USERNAME_FIELD = 'email'  # ✅ Set email as the username
    REQUIRED_FIELDS = ['student_id', 'name', 'year', 'semester']


    def __str__(self):
        return self.name
# class Student(AbstractBaseUser, PermissionsMixin):  # ✅ Add PermissionsMixin
#     student_id = models.CharField(max_length=20, unique=True)
#     email = models.EmailField(unique=True)
#     branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
#     year = models.PositiveIntegerField(choices=[(i, f"Year {i}") for i in range(1, 5)])
#     semester = models.PositiveIntegerField(choices=[(i, f"Semester {i}") for i in range(1, 3)])
#     phone_number = models.CharField(
#         max_length=15, validators=[RegexValidator(regex=r'^\+?\d{10,15}$', message="Enter a valid phone number")]
#     )
#     parent_phone_number = models.CharField(
#         max_length=15, validators=[RegexValidator(regex=r'^\+?\d{10,15}$', message="Enter a valid phone number")]
#     )
#     academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE)
#     is_lateral_entry = models.BooleanField(default=False)
#     face_descriptor = models.JSONField()
#     device_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    
#     # ✅ Add password field explicitly
#     password = models.CharField(max_length=255)

#     # ✅ Fix Django E304 Reverse Accessor Conflict
#     groups = models.ManyToManyField(
#         "auth.Group", related_name="student_groups", blank=True
#     )
#     user_permissions = models.ManyToManyField(
#         "auth.Permission", related_name="student_permissions", blank=True
#     )

#     is_active = models.BooleanField(default=True)  # ✅ Ensure the user is active
#     is_staff = models.BooleanField(default=False)  # ✅ Required for Django admin
#     is_superuser = models.BooleanField(default=False)  # ✅ Superuser control

#     USERNAME_FIELD = 'email'  # ✅ Set email as the username
#     REQUIRED_FIELDS = ['student_id', 'name', 'year', 'semester']

#     objects = StudentManager()

#     def __str__(self):
#         return self.name



class Device(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="devices")
    fingerprint = models.CharField(max_length=255, unique=True)  # Unique device identifier
    user_agent = models.TextField()
    ip_address = models.GenericIPAddressField()
    registered_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Device for {self.student.name} - {self.fingerprint}"
