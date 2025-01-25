from django.db import models

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
