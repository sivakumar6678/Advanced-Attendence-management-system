from django.urls import path
from core.views import BranchListCreate, AcademicYearListCreate, SuperAdminLogin, FacultyListView, AddFaculty, BranchDetailUpdateDelete,AcademicYearDetailUpdateDelete
from core.views import BranchDetailUpdateDelete
from rest_framework_simplejwt.views import TokenRefreshView
urlpatterns = [
    path('branches/', BranchListCreate.as_view(), name='branch-list-create'),
    path('branches/<int:pk>/', BranchDetailUpdateDelete.as_view()),
    path('academic-years/', AcademicYearListCreate.as_view(), name='academic-year-list-create'),
    path('academic-years/<int:pk>/', AcademicYearDetailUpdateDelete.as_view(), name='academic-year-detail-update-delete'),
    path('superadmin/login/', SuperAdminLogin.as_view(), name='superadmin-login'),
    path('superadmin/faculty-list/', FacultyListView.as_view(), name='faculty-list'),
    path('superadmin/add-faculty/', AddFaculty.as_view(), name='add-faculty'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh')
]
