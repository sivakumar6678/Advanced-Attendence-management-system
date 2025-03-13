from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import CRCProfile
from rest_framework_simplejwt.tokens import Token
from rest_framework import serializers
from core.models import User
from teacher.models import Faculty
from .models import Subject, Timetable, TimetableEntry
class CRCTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT Serializer for CRC"""
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # ✅ Add custom claims for CRC
        token["user_id"] = user.id  # Matches `USER_ID_CLAIM`
        token["email"] = user.email
        token["role"] = "crc"

        return token

class CRCToken(Token):
    """Custom JWT Token class for CRC authentication"""

    def __init__(self, crc):
        """Initialize the token with CRC details"""
        super().__init__()
        self.payload = {
            "user_id": crc.id,  # ✅ Ensure Django recognizes `user_id`
            "email": crc.email,
            "role": "crc"
        }


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'name', 'crc']

    def create(self, validated_data):
        crc = validated_data['crc']
        # Ensure subject name is unique within the same CRC
        if Subject.objects.filter(name=validated_data['name'], crc=crc).exists():
            raise serializers.ValidationError({"error": "Subject already exists for this CRC"})
        
        return super().create(validated_data)

class TimetableEntrySerializer(serializers.ModelSerializer):
    subject_id = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(), source='subject', allow_null=True
    )
    faculty_id = serializers.PrimaryKeyRelatedField(
        queryset=Faculty.objects.all(), source='faculty', allow_null=True
    )

    class Meta:
        model = TimetableEntry
        fields = ['id', 'day', 'time_slot', 'subject_id', 'faculty_id']


class TimetableSerializer(serializers.ModelSerializer):
    crc_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='crc'
    )
    entries = TimetableEntrySerializer(many=True)

    class Meta:
        model = Timetable
        fields = ['id', 'crc_id', 'branch', 'year', 'semester', 'academic_year', 'is_finalized', 'entries']

    def create(self, validated_data):
        entries_data = validated_data.pop('entries')
        timetable = Timetable.objects.create(**validated_data)

        for entry_data in entries_data:
            entry = TimetableEntry.objects.create(**entry_data)
            timetable.entries.add(entry)

        return timetable
