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
        fields = '__all__'

class TimetableEntrySerializer(serializers.ModelSerializer):
    subject_id = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(), source='subject', write_only=True
    )
    faculty_id = serializers.PrimaryKeyRelatedField(
        queryset=Faculty.objects.all(), source='faculty', write_only=True
    )

    subject = serializers.PrimaryKeyRelatedField(read_only=True)  # Represent subject as ID
    faculty = serializers.PrimaryKeyRelatedField(read_only=True)  # Represent faculty as ID

    class Meta:
        model = TimetableEntry
        fields = ['id', 'day', 'time_slot', 'subject_id', 'faculty_id', 'subject', 'faculty']


class TimetableSerializer(serializers.ModelSerializer):
    crc_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='crc')
    entries = TimetableEntrySerializer(many=True)

    class Meta:
        model = Timetable
        fields = ['id', 'crc_id', 'branch', 'is_finalized', 'entries']

    def create(self, validated_data):
        entries_data = validated_data.pop('entries')
        timetable = Timetable.objects.create(**validated_data)

        new_entries = []
        for entry_data in entries_data:
            subject = entry_data.pop('subject')  # Get subject object
            faculty = entry_data.pop('faculty')  # Get faculty object

            entry = TimetableEntry.objects.create(
                day=entry_data['day'],
                time_slot=entry_data['time_slot'],
                subject=subject,
                faculty=faculty
            )
            new_entries.append(entry)

        timetable.entries.set(new_entries)
        return timetable

    def update(self, instance, validated_data):
        entries_data = validated_data.pop('entries', [])

        # Update timetable fields
        instance.crc = validated_data.get('crc', instance.crc)
        instance.branch = validated_data.get('branch', instance.branch)
        instance.is_finalized = validated_data.get('is_finalized', instance.is_finalized)
        instance.save()

        # Clear old entries before adding updated ones
        instance.entries.clear()
        new_entries = []

        for entry_data in entries_data:
            subject = entry_data.pop('subject')  # Get subject object
            faculty = entry_data.pop('faculty')  # Get faculty object

            new_entry = TimetableEntry.objects.create(
                day=entry_data['day'],
                time_slot=entry_data['time_slot'],
                subject=subject,
                faculty=faculty
            )
            new_entries.append(new_entry)

        instance.entries.set(new_entries)
        return instance