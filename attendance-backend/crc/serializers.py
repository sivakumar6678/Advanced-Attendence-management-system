from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import CRCProfile
from rest_framework_simplejwt.tokens import Token

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