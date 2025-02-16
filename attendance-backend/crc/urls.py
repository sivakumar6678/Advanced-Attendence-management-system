from django.urls import path
from .views import RegisterCRC, LoginCRC

urlpatterns = [
    path('register/', RegisterCRC.as_view(), name='register-crc'),
    path('login/', LoginCRC.as_view(), name='login-crc'),
]
