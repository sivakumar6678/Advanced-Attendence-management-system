# Generated by Django 5.1.4 on 2025-04-13 11:50

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('crc', '0008_remove_timetable_is_fully_completed'),
    ]

    operations = [
        migrations.AddField(
            model_name='subject',
            name='status',
            field=models.CharField(choices=[('active', 'Active'), ('completion_requested', 'Completion Requested'), ('completed', 'Completed')], default='active', max_length=20),
        ),
    ]
