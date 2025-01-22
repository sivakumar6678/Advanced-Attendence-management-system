import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) {}

  // Update the method signature by removing the generic type
  registerStudent(data: any): Observable<any> {
    const body = { ...data };
    console.log(body);
    console.log('registering student');
    return this.http.post('/api/register', body);
  }

  loginStudent(data: any): Observable<any> {
    const body = { ...data };
    return this.http.post('/api/login', body);
  }
}
