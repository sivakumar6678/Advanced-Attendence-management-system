from rest_framework import serializers
from core.models import Branch
from core.models import AcademicYear
class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ['id', 'name', 'head_of_department', 'description']
class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = ['id', 'start_year', 'end_year']