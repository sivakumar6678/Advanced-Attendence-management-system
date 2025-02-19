import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin, Group, Permission
from core.models import Branch
from teacher.models import Faculty

class CRCManager(BaseUserManager):
    def create_crc(self, employee_id, email, phone_number, branch, year, semester, password=None):
        if not email or not employee_id:
            raise ValueError("Employee ID and Email are required")

        email = self.normalize_email(email)
        user = self.model(
            crc_id=str(uuid.uuid4())[:8],  # Auto-generate an 8-character CRC ID
            employee_id=employee_id,
            email=email,
            phone_number=phone_number,
            branch=branch,
            year=year,
            semester=semester
        )
        user.set_password(password)  # ✅ Ensures password is hashed
        user.save(using=self._db)
        return user


class CRC(AbstractBaseUser,PermissionsMixin):
    crc_id = models.CharField(max_length=10, unique=True, editable=False)  # Unique CRC ID
    employee_id = models.CharField(max_length=20, unique=True)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)  # Optional
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    year = models.PositiveIntegerField(choices=[(i, f"Year {i}") for i in range(1, 5)])
    semester = models.PositiveIntegerField(choices=[(i, f"Semester {i}") for i in range(1, 3)])

    groups = models.ManyToManyField(Group, related_name="crc_users", blank=True)  # ✅ Fix conflict
    user_permissions = models.ManyToManyField(Permission, related_name="crc_users_permissions", blank=True)  # ✅ Fix conflict

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['employee_id', 'branch', 'year', 'semester']

    objects = CRCManager()

    def __str__(self):
        return f"CRC-{self.crc_id} ({self.email})"
