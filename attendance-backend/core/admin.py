from django.contrib import admin
from .models import Branch, AcademicYear,  Faculty, SuperAdmin

@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'head_of_department')
    search_fields = ('name', 'head_of_department')
    ordering = ('id',)
@admin.register(AcademicYear)
class AcademicYearAdmin(admin.ModelAdmin):
    list_display = ['start_year', 'end_year']

@admin.register(SuperAdmin)
class SuperAdminAdmin(admin.ModelAdmin):
    list_display = ('name', 'email')
    search_fields = ('name', 'email')
    ordering = ('name',)
admin.site.register(Faculty)