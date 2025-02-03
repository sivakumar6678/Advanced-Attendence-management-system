import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://127.0.0.1:8000/api/students'; // Adjust if needed

  constructor(private http: HttpClient) {}

  // Update the method signature by removing the generic type
  registerStudent(data: any): Observable<any> {
    const body = { ...data };
    console.log(body);
    console.log('registering student');
    return this.http.post(`${this.baseUrl}/register/`, body);

    // return this.http.post('/api/students/register', body);
  }

  loginStudent(data: any): Observable<any> {
    const body = { ...data };
    console.log("login student",body);
    return this.http.post(`${this.baseUrl}/login/`,body);
    // return this.http.post('/api/students/login', body);
  }
}
