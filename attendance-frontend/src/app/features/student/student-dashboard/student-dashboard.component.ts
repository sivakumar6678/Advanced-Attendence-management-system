import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { Router } from '@angular/router';
import { HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-student-dashboard',
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.css']
})
export class StudentDashboardComponent implements OnInit {
  studentProfile: any;
  attendanceStatus = "Present";
  attendancePercentage = 85;
  publicTimetable: any[] = [];
  activeSection: string = 'dashboard'; // Default section

  constructor(
    private studentDashboardService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Fetch student profile (remains constant)
    const headers = new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('access_token')}`);
    this.studentDashboardService.getStudentProfile(headers).subscribe(
      (data) => {
      this.studentProfile = data;
      console.log('Student Profile:', this.studentProfile);
      },
      (error) => {
      console.error('Authorization failed', error);
      this.router.navigate(['/student/login']);
      }
    );

    // Fetch public timetable (without headers)
    this.studentDashboardService.getPublicTimetables().subscribe(
      (data) => {
        this.publicTimetable = data;
        console.log('Public Timetable:', this.publicTimetable);
      },
      (error) => {
        console.error('Failed to fetch public timetable', error);
      }
    );

    // Fetch attendance
    // this.studentDashboardService.getStudentAttendance().subscribe(
    //   (data) => {
    //     this.attendanceStatus = data.status;
    //     this.attendancePercentage = data.percentage;
    //     console.log('Attendance:', data);
    //   },
    //   (error) => {
    //     console.error('Failed to fetch attendance', error);
    //   }
    // );
  }

  // Switch sections within the same component
  setActiveSection(section: string) {
    this.activeSection = section;
  }

  logout() {
    localStorage.removeItem('access_token');
    this.router.navigate(['/student/login']);
  }
}
