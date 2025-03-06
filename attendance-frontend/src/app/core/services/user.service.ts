import { Injectable } from '@angular/core';
import { HttpClient , HttpHeaders} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {

  private baseUrl = 'http://127.0.0.1:8000/api'; // Adjust if needed
  private crcDetails: any = null; // Store CRC details here

  constructor(private http: HttpClient) {}
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');  // Retrieve the stored token
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

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

  
  getCrcProfile(headers: HttpHeaders): Observable<any> {
    return this.http.get(`${this.baseUrl}/crc/dashboard/`, { headers });
  }
  getStudentProfile(headers: HttpHeaders): Observable<any> {
    return this.http.get(`${this.baseUrl}/students/dashboard/`, { headers });
  }
  getFacultyProfile(headers: HttpHeaders): Observable<any> {
    return this.http.get(`${this.baseUrl}/faculty/dashboard/`, { headers });
  }

  getPublicTimetables(): Observable<any> {
    return this.http.get(`${this.baseUrl}/crc/public/timetables/`);
  }

  getFaculties():Observable<any>{
    return this.http.get(`${this.baseUrl}/crc/getfactuly/`);
  }
  // Fetch all subjects
  getSubjects(): Observable<any> {
    return this.http.get(`${this.baseUrl}/crc/subjects/` );
  }

  setCRCDetails(details: any) {
    this.crcDetails = details;
  }

  getCRCDetails() {
    return this.crcDetails;
  }

  // Add a new subject
  addSubject(subjectData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/crc/subjects/`,subjectData );
  }

  // Delete a subject
  deleteSubject(subjectId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/crc/subjects/${subjectId}/`);
  }
  // Fetch all timetables
  getTimetables(): Observable<any> {
    return this.http.get(`${this.baseUrl}/crc/timetables/` );
  }

  // Add a new timetable
  addTimetable(timetableData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/crc/timetables/`,  timetableData,{ headers: this.getAuthHeaders() });
  }

  // ✅ Update an existing timetable (PUT)
  updateTimetable(timetableId: number, timetableData: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/crc/timetables/${timetableId}/`, {timetableData, headers: this.getAuthHeaders() });
  }
  // Finalize a timetable
  finalizeTimetable(timetableId: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/crc/timetables/${timetableId}/finalize/`,{}, {headers: this.getAuthHeaders() });
  }
}
