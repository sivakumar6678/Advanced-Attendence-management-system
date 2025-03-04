from django.contrib import admin

# Register your models here.
from .models import CRCProfile , Timetable,TimetableEntry

admin.site.register(CRCProfile)
class CRCAdmin(admin.ModelAdmin):
    list_display = ('id','email', 'branch', 'year', 'semester')
    list_filter = ('branch', 'year', 'semester')
    search_fields = ('email', 'branch__name', 'year', 'semester')
    ordering = ('branch', 'year', 'semester')

admin.site.register(Timetable)
class TimetableAdmin(admin.ModelAdmin):
    list_display = ('id', 'branch', 'is_finalized')
    list_filter = ('branch', 'is_finalized')
    search_fields = ('branch__name', 'is_finalized')
    ordering = ('branch', 'is_finalized')

admin.site.register(TimetableEntry)
class TimetableEntryAdmin(admin.ModelAdmin):
    list_display = ('day', 'time_slot', 'subject', 'faculty')
    list_filter = ('day', 'time_slot')
    search_fields = ('day', 'time_slot', 'subject__name', 'faculty__email')
    ordering = ('day', 'time_slot')