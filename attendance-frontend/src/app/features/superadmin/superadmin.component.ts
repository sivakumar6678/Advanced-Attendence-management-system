import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-superadmin',
  templateUrl: './superadmin.component.html',
  styleUrls: ['./superadmin.component.css']
})
export class SuperadminComponent implements OnInit {
  loginForm: FormGroup;
  facultyForm: FormGroup;
  faculties: any[] = [];
  isLoggedIn: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });

    this.facultyForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      employee_id: ['', Validators.required]
    });
  }

  ngOnInit() {
    // If already logged in, fetch faculties
    const token = localStorage.getItem('superadmin-token');
    if (token) {
      this.isLoggedIn = true;
      this.loadFaculties(token);
    }
  }

  onLogin() {
    if (this.loginForm.valid) {
      const loginData = this.loginForm.value;
      this.login(loginData).subscribe(
        (response: any) => {
          localStorage.setItem('superadmin-token', response.token);
          this.isLoggedIn = true;
          this.loadFaculties(response.token);
          this.successMessage = 'Login successful!';
          this.errorMessage = '';
        },
        (error) => {
          this.errorMessage = error.error.error || 'Login failed!';
          this.successMessage = '';
        }
      );
    }
  }

  login(data: any): Observable<any> {
    return this.http.post('http://localhost:8000/api/core/superadmin/login/', data);  // Replace with correct URL
  }

  loadFaculties(token: string) {
    this.http.get('http://localhost:8000/api/core/faculty/list/', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).subscribe(
      (response: any) => {
        this.faculties = response;
      },
      (error) => {
        this.errorMessage = error.error.error || 'Failed to load faculty list!';
      }
    );
  }

  onRegisterFaculty() {
    if (this.facultyForm.valid) {
      const newFaculty = this.facultyForm.value;
      const token = localStorage.getItem('superadmin-token');
      if (token) {
        this.http.post('http://localhost:8000/api/core/faculty/register/', newFaculty, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).subscribe(
          (response: any) => {
            this.successMessage = 'Faculty registered successfully!';
            this.errorMessage = '';
            this.loadFaculties(token);  // Reload the faculty list
          },
          (error) => {
            this.errorMessage = error.error.error || 'Failed to register faculty!';
            this.successMessage = '';
          }
        );
      }
    }
  }

  onLogout() {
    localStorage.removeItem('superadmin-token');
    this.isLoggedIn = false;
  }
}
