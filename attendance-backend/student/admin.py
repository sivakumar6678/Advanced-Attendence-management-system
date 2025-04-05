from django.contrib import admin

# Register your models here.

from .models import Student, StudentAttendance, Device
@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'email', 'branch', 'is_active','password','phone_number','student_id','academic_year','device_id')
    search_fields = ('name', 'email', 'branch')
    list_filter = ('branch', 'is_active')
    ordering = ('branch', 'name')

@admin.register(StudentAttendance)
class StudentAttendanceAdmin(admin.ModelAdmin):
    list_display = ('id', 'student', 'session', 'timestamp', 'status')
    search_fields = ('student', 'session')
    list_filter = ('status', 'timestamp')
    ordering = ('student', 'session', 'timestamp')

@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ('id', 'student', 'device_id', 'device_name', 'device_type', 'platform', 'browser', 'os_version', 'screen_resolution', 'ip_address')
    search_fields = ('student__name', 'device_id')
    list_filter = ('device_type', 'platform')
    ordering = ('student', 'device_id')
