from django.http import JsonResponse

def home(request):
    data = {"message": "Welcome to the Attendance System hurrah!"}
    return JsonResponse(data)
