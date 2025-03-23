from django.contrib import admin
from .models import Faculty,AttendanceSession
# Register your models here.
@admin.register(Faculty)
class FacultyAdmin(admin.ModelAdmin):
    list_display = ('id', 'full_name', 'email', 'branch', 'is_active','password','phone_number','employee_id','joined_date','exit_date','rejoin_date')
    search_fields = ('full_name', 'email', 'branch')
    list_filter = ('branch', 'is_active')
    ordering = ('branch', 'full_name')

@admin.register(AttendanceSession)
class AttendanceSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'faculty', 'subject', 'branch', 'year', 'semester', 'is_active','start_time','day')
    search_fields = ('faculty', 'subject')
    list_filter = ('branch', 'is_active')
    ordering = ('branch', 'faculty')