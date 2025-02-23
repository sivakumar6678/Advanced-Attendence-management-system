from django.contrib import admin

# Register your models here.

from .models import Student
@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'email', 'branch', 'is_active','password','phone_number','student_id','academic_year',)
    search_fields = ('name', 'email', 'branch')
    list_filter = ('branch', 'is_active')
    ordering = ('branch', 'name')