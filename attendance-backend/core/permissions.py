# core/permissions.py
from rest_framework import permissions

class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'student'

class IsTeacher(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'teacher'

class IsCRC(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'crc'
