from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()

class Teacher(models.Model):
    """Stores registered faculty who successfully sign up"""
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    faculty_ref = models.OneToOneField("core.Faculty", on_delete=models.CASCADE)

    def __str__(self):
        return self.user.username
