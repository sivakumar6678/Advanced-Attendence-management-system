import { Routes } from '@angular/router';
import { TestComponent } from './test/test.component';
import { StudentAuthComponent } from './features/student/student-auth/student-auth.component';
import { TeacherAuthComponent } from './features/teacher/teacher-auth/teacher-auth.component';
import { CrcAuthComponent } from './features/crc/crc-auth/crc-auth.component';
import { HomeComponent } from './shared/components/home/home.component';
import { TeacherDashboardComponent } from './features/teacher/teacher-dashboard/teacher-dashboard.component';

import { StudentDashboardComponent } from './features/student/student-dashboard/student-dashboard.component';
import { StudentAttendanceComponent } from './features/student/student-attendance/student-attendance.component';
import { TeacherAttendanceComponent } from './features/teacher/teacher-attendance/teacher-attendance.component';
import { CrcDashboardComponent } from './features/crc/crc-dashboard/crc-dashboard.component';
import { CrcTimetableComponent } from './features/crc/crc-timetable/crc-timetable.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';


export const routes: Routes = [
    { path: '', component: HomeComponent }, // Home Page
    {path: 'home', component: HomeComponent},
    {path: 'test', component: TestComponent},
    {
        path: 'student-auth',
        component: StudentAuthComponent,
        canActivate: [authGuard]  // Protect route with authentication guard
      },
      
      // Routes with both authGuard (authentication check) and roleGuard (role check)
      {
        path: 'teacher-auth',
        component: TeacherAuthComponent,
        canActivate: [authGuard, roleGuard]  // Protect route with both guards
      },
      
      {
        path: 'crc-auth',
        component: CrcAuthComponent,
        canActivate: [authGuard, roleGuard]  // Protect route with both guards
      },
    {
      path: 'student',
      children: [
        { path: '', redirectTo: 'dashboard', pathMatch: 'full' }, // Redirect to dashboard
        { path: 'dashboard', component: StudentDashboardComponent }, // Student Dashboard
        { path: 'attendance', component: StudentAttendanceComponent }, // Student Attendance
      ],
    },
    {
      path: 'teacher',
      children: [
        { path: '', redirectTo: 'dashboard', pathMatch: 'full' }, // Redirect to dashboard
        { path: 'dashboard', component: TeacherDashboardComponent }, // Teacher Dashboard
        { path: 'attendance', component: TeacherAttendanceComponent }, // Teacher Attendance
      ],
    },
    {
      path: 'crc',
      children: [
        { path: '', redirectTo: 'dashboard', pathMatch: 'full' }, // Redirect to dashboard
        { path: 'dashboard', component: CrcDashboardComponent }, // CRC Dashboard
        { path: 'timetable', component: CrcTimetableComponent }, // CRC Timetable Management
      ],
    },
  ];
  