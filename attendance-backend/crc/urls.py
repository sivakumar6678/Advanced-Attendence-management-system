from django.urls import path
from .views import RegisterCRC, LoginCRC, FetchFacultyDetails, CRCDashboardView

urlpatterns = [
    path('register/', RegisterCRC.as_view(), name='register-crc'),
    path('login/', LoginCRC.as_view(), name='login-crc'),
    # path('faculty-details/', FetchFacultyDetails.as_view(), name='fetch-faculty'),
    path('faculty-details/', FetchFacultyDetails.as_view(), name='fetch-faculty-details'),
    path('dashboard/', CRCDashboardView.as_view(), name='crc-dashboard'),]
