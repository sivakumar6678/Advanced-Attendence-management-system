import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-superadmin',
  templateUrl: './superadmin.component.html',
  styleUrls: ['./superadmin.component.css']
})
export class SuperadminComponent implements OnInit {
  isLoggedIn = false;
  email = '';
  password = '';
  facultyList: any[] = [];
  newFaculty = { name: '', email: '', employee_id: '' };
  errorMessage = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    if (localStorage.getItem('superadmin')) {
      this.isLoggedIn = true;
      this.getFacultyList();
    }
  }

  login() {
    this.http.post('http://127.0.0.1:8000/api/core/superadmin/login/', { email: this.email, password: this.password })
      .subscribe(
        (res: any) => {
          this.isLoggedIn = true;
          localStorage.setItem('superadmin', this.email);
          this.getFacultyList();
        },
        err => {
          this.errorMessage = err.error.error || 'Login failed';
        }
      );
  }

  getFacultyList() {
    this.http.get('http://127.0.0.1:8000/api/core/superadmin/faculty-list/')
      .subscribe(
        (res: any) => {
          this.facultyList = res;
        },
        err => {
          this.errorMessage = 'Failed to load faculty list';
        }
      );
  }

  addFaculty() {
    this.http.post('http://127.0.0.1:8000/api/core/superadmin/add-faculty/', this.newFaculty)
      .subscribe(
        res => {
          this.getFacultyList();
          this.newFaculty = { name: '', email: '', employee_id: '' };
        },
        err => {
          this.errorMessage = err.error.error || 'Failed to add faculty';
        }
      );
  }

  logout() {
    this.isLoggedIn = false;
    localStorage.removeItem('superadmin');
  }
}
