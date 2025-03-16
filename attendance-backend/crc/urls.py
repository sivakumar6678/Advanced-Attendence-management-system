from django.urls import path
from .views import RegisterCRC, LoginCRC, FetchFacultyDetails, CRCDashboardView, GetFaculty, SubjectListCreateView, SubjectDeleteView,   FinalizeTimetableView, TimetableView, PublicTimetableView , TimetableConfigView, GetSubjectById

urlpatterns = [
    path('register/', RegisterCRC.as_view(), name='register-crc'),
    path('login/', LoginCRC.as_view(), name='login-crc'),
    path('faculty-details/', FetchFacultyDetails.as_view(), name='fetch-faculty-details'),
    path('dashboard/', CRCDashboardView.as_view(), name='crc-dashboard'),




    path('timetable/config/',TimetableConfigView.as_view(), name="TimetableConfigView"),
    path('public/timetables/', PublicTimetableView.as_view(), name='public-timetable'),
    path('timetables/', TimetableView.as_view(), name='get-create-timetable'),
    path('timetables/<int:timetable_id>/', TimetableView.as_view(), name='update-timetable'),
    path('timetables/<int:timetable_id>/finalize/', FinalizeTimetableView.as_view(), name='finalize-timetable'),

    path('getfactuly/', GetFaculty.as_view(), name='get-faculty'),
    

    path('subjects/<int:subject_id>/', GetSubjectById.as_view(), name='get_subject_name'),
    path('subjects/', SubjectListCreateView.as_view(), name='subject-list-create'),
    path('subjects/<int:subject_id>/', SubjectDeleteView.as_view(), name='subject-delete'),
    
    ]
