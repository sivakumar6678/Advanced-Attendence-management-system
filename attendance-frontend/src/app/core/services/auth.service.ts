import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://127.0.0.1:8000/api'; // Adjust if needed

  constructor(private http: HttpClient) {}

  // Update the method signature by removing the generic type
  registerStudent(data: any): Observable<any> {
    const body = { ...data };
    console.log(body);
    console.log('registering student');
    return this.http.post(`${this.baseUrl}/students/register/`, body);

    // return this.http.post('/api/students/register', body);
  }

  loginStudent(data: any): Observable<any> {
    const body = { ...data };
    console.log("login student",body);
    return this.http.post(`${this.baseUrl}/students/login/`,body);
    // return this.http.post('/api/students/login', body);
  }

  login(email: string, password: string): Observable<any> {
    console.log("email and passwrod",email,password);
    return this.http.post(`${this.baseUrl}/faculty/login/`, { email, password });
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/faculty/register/`, data);
  }
}
