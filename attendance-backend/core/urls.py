from django.urls import path
from core.views import BranchListCreate, AcademicYearListCreate, SuperAdminLogin, FacultyListView, AddFaculty

urlpatterns = [
    path('branches/', BranchListCreate.as_view(), name='branch-list-create'),
    path('academic-years/', AcademicYearListCreate.as_view(), name='academic-year-list-create'),
    path('superadmin/login/', SuperAdminLogin.as_view(), name='superadmin-login'),
    path('superadmin/faculty-list/', FacultyListView.as_view(), name='faculty-list'),
    path('superadmin/add-faculty/', AddFaculty.as_view(), name='add-faculty'),
]
