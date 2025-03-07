# Generated by Django 5.1.4 on 2025-03-05 13:38

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('crc', '0004_remove_timetable_entries_timetableentry_timetable_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RemoveField(
            model_name='timetableentry',
            name='timetable',
        ),
        migrations.AddField(
            model_name='timetable',
            name='entries',
            field=models.ManyToManyField(related_name='timetables', to='crc.timetableentry'),
        ),
        migrations.AlterField(
            model_name='timetable',
            name='crc',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='timetables', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='timetableentry',
            name='day',
            field=models.CharField(max_length=10),
        ),
        migrations.AlterField(
            model_name='timetableentry',
            name='faculty',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL),
        ),
    ]
