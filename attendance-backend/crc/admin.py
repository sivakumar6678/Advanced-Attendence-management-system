from django.contrib import admin

# Register your models here.
from .models import CRC

admin.site.register(CRC)
class CRCAdmin(admin.ModelAdmin):
    list_display = ('email', 'branch', 'year', 'semester')
    list_filter = ('branch', 'year', 'semester')
    search_fields = ('email', 'branch__name', 'year', 'semester')
    ordering = ('branch', 'year', 'semester')