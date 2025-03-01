import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
@Component({
  selector: 'app-teacher-dashboard',
  templateUrl: './teacher-dashboard.component.html',
  styleUrl: './teacher-dashboard.component.css'
})
export class TeacherDashboardComponent implements OnInit {
  teacherProfile: any;
  
  constructor(private teacherDashboardService: UserService,
              private router: Router
  ) {}

  ngOnInit(): void {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('access_token')}`);
  
    this.teacherDashboardService.getFacultyProfile(headers).subscribe(
      (data) => {
        this.teacherProfile = data;
        console.log('Teacher Profile:', this.teacherProfile);
      },
      (error) => {
        console.error('Authorization failed', error);
        this.router.navigate(['/teacher/login']); // Redirect if unauthorized
      }
    );
  }

}
