# Generated by Django 5.1.4 on 2025-03-07 16:43

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('crc', '0012_remove_subject_academic_year_remove_subject_branch_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='subject',
            name='academic_year',
            field=models.CharField(default='2021-2025', max_length=9),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='subject',
            name='branch',
            field=models.CharField(default='CSE', max_length=255),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='subject',
            name='semester',
            field=models.PositiveIntegerField(default=2),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='subject',
            name='year',
            field=models.PositiveIntegerField(default=4),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='subject',
            name='name',
            field=models.CharField(max_length=255),
        ),
    ]
