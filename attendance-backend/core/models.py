from django.db import models

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
