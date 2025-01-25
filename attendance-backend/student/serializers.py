from rest_framework import serializers
from core.models import Student, Branch, AcademicYear

class StudentSerializer(serializers.ModelSerializer):
    branch = BranchSerializer(read_only=True)
    branch_id = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(), source='branch', write_only=True
    )
    academic_year = AcademicYearSerializer(read_only=True)
    academic_year_id = serializers.PrimaryKeyRelatedField(
        queryset=AcademicYear.objects.all(), source='academic_year', write_only=True
    )

    class Meta:
        model = Student
        fields = [
            'student_id', 'name', 'email', 'branch', 'branch_id', 'year', 'semester',
            'phone_number', 'academic_year', 'academic_year_id', 'is_lateral_entry',
            'face_descriptor'
        ]
