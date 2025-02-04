from rest_framework import serializers
from .models import Faculty

class FacultyRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Faculty
        fields = ['full_name', 'email', 'branch', 'phone_number', 'password', 'employee_id', 'joined_date']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        password = validated_data.pop('password')
        faculty = Faculty.objects.create(**validated_data)
        faculty.set_password(password)  # Hash password
        faculty.save()
        return faculty

class FacultyLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
