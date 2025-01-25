from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from core.models import Branch
from core.serializers import BranchSerializer
from core.models import AcademicYear
from core.serializers import AcademicYearSerializer

class BranchListCreate(APIView):
    def get(self, request):
        branches = Branch.objects.all()
        serializer = BranchSerializer(branches, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = BranchSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
class AcademicYearListCreate(APIView):
    def get(self, request):
        years = AcademicYear.objects.all()
        serializer = AcademicYearSerializer(years, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = AcademicYearSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)