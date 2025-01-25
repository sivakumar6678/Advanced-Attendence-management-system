from django.urls import path
from core.views import BranchListCreate, AcademicYearListCreate

urlpatterns = [
    path('branches/', BranchListCreate.as_view(), name='branch-list-create'),
    path('academic-years/', AcademicYearListCreate.as_view(), name='academic-year-list-create'),
]
