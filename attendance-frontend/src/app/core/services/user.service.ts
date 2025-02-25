import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private baseUrl = 'http://127.0.0.1:8000/api'; // Adjust if needed

  constructor(private http: HttpClient) {}

  // Fetch Branches from backend
  getBranches(): Observable<any> {
    console.log('Fetching branches');
    console.log(`${this.baseUrl}/core/branches/`);
    return this.http.get(`${this.baseUrl}/core/branches/`);
  }

  // Fetch Academic Years from backend
  getAcademicYears(): Observable<any> {
    return this.http.get(`${this.baseUrl}/core/academic-years/`);
  }

  getCrcProfile(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/crc/dashboard/`);
  }

}
