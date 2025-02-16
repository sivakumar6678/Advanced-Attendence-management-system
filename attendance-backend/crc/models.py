from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.core.validators import RegexValidator
from core.models import Branch

class CRCManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field is required")
        email = self.normalize_email(email)
        crc = self.model(email=email, **extra_fields)
        crc.set_password(password)  # Hash password
        crc.save(using=self._db)
        return crc

class CRC(AbstractBaseUser):
    crc_id = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(
        max_length=15, validators=[RegexValidator(regex=r'^\+?\d{10,15}$', message="Enter a valid phone number")]
    )
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)  # CRC is assigned to a branch
    is_active = models.BooleanField(default=True)  # Allow CRC to be activated/deactivated

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['crc_id', 'name']

    objects = CRCManager()

    def __str__(self):
        return self.name
