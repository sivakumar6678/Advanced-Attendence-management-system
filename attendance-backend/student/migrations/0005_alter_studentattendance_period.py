# Generated by Django 5.1.4 on 2025-04-03 14:25

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('student', '0004_studentattendance_period'),
    ]

    operations = [
        migrations.AlterField(
            model_name='studentattendance',
            name='period',
            field=models.CharField(max_length=50),
        ),
    ]
