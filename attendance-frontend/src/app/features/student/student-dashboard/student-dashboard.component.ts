import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { Router } from '@angular/router';
import { HttpHeaders } from '@angular/common/http';


@Component({
  selector: 'app-student-dashboard',
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.css'
})
export class StudentDashboardComponent implements OnInit {
  studentProfile: any;
  constructor(private studentDashboardService: UserService,
              private router: Router
  ) {

  }

  ngOnInit(): void {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('access_token')}`);
    this.studentDashboardService.getStudentProfile(headers).subscribe(
      (data) => {
        this.studentProfile = data;
        console.log('Student Profile:', this.studentProfile);
      },
      (error) => {
        console.error('Authorization failed', error);
        this.router.navigate(['/student/login']); // Redirect if unauthorized
      }
    );
  }
  


}
