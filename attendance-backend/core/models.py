from django.db import models

class Branch(models.Model):
    name = models.CharField(max_length=100, unique=True)
    head_of_department = models.CharField(max_length=100, blank=True, null=True)  # Optional field for HOD

    def __str__(self):
        return self.name
