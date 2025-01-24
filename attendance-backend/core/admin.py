from django.contrib import admin
from .models import Branch

@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'head_of_department')
    search_fields = ('name', 'head_of_department')
    ordering = ('id',)
