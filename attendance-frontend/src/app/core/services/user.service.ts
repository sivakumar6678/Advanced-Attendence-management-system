import { Injectable } from '@angular/core';
import { HttpClient , HttpHeaders,HttpParams} from '@angular/common/http';
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

  getPublicTimetables(year: number, semester: number, branch: string, academicYear: string): Observable<any> {
    const params = new HttpParams()
    .set('year', year.toString())
    .set('semester', semester.toString())
    .set('branch', branch)
    .set('academic_year', academicYear);
  
    return this.http.get(`${this.baseUrl}/crc/public/timetables/`, { params });
  }
  

  getFaculties():Observable<any>{
    return this.http.get(`${this.baseUrl}/crc/getfactuly/`);
  }
  
  setCRCDetails(details: any) {
    this.crcDetails = details;
  }
  
  getCRCDetails() {
    return this.crcDetails;
  }
  getSubjects(crcId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/crc/subjects/?crc_id=${crcId}`,{ headers: this.getAuthHeaders() });
  }
  getSubjectById(subjectId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/crc/subjects/${subjectId}/`);
  }
  
  
  addSubject(subjectName: string, crcId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/crc/subjects/`, {
      name: subjectName,
      crc: crcId
    },{ headers: this.getAuthHeaders() });
  }
  
  deleteSubject(subjectId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/crc/subjects/${subjectId}/`);
  }
  

  getTimetables(crcId: number, year: number, semester: number, branch: string, academicYear: string): Observable<any> {
    const params = new HttpParams()
      .set('crc_id', crcId.toString())
      .set('year', year.toString())
      .set('semester', semester.toString())
      .set('branch', branch)
      .set('academic_year', academicYear);
  
    return this.http.get(`${this.baseUrl}/crc/timetables/`, {
      headers: this.getAuthHeaders(),
      params: params  // ✅ Sending query parameters correctly
    });
  }
  
  getTimetableConfig(): Observable<any> {
    return this.http.get(`${this.baseUrl}/crc/timetable/config/`);
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


  getAssignedSubjects(facultyId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/faculty/${facultyId}/assigned-subjects/`, {
      headers: this.getAuthHeaders(),
    });
  }

  startAttendanceSession(sessionData: any) {
    return this.http.post(`${this.baseUrl}/faculty/start-attendance/`, sessionData);
  }
  getActiveAttendanceSessions(studentId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/students/active-sessions/${studentId}/`);
  }

  markAttendance(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/students/mark-attendance/`, data);
  }
  getAttendanceCount(sessionId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/students/attendance-count/${sessionId}/`);
  }
  endAttendanceSession(sessionId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/faculty/end-session/${sessionId}/`, {});
  }
  getActiveAttendanceSession(facultyId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/faculty/active-session/${facultyId}/`);
  }
  getAttendanceDetails(studentId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/students/attendance-details/${studentId}/`);
  }
 
  getAttendanceMatrix(subjectId: number, startDate: string, endDate: string) {
    return this.http.get<any>(
      `${this.baseUrl}/faculty/attendance/matrix/?subject_id=${subjectId}&start_date=${startDate}&end_date=${endDate}`
    );
  }

  updateAttendanceMatrix(updates: any[]) {
    return this.http.post<any>(
      `${this.baseUrl}/faculty/attendance/matrix/`,
      { updates }
    );
  }
  getClassAttendanceReport(branch: number, year: number, semester: number, academic_year: number, from_date: string, to_date: string) {
    return this.http.get<any>(`${this.baseUrl}/crc/class-attendance-report/`, {
      params: { branch, year, semester, academic_year, from_date, to_date }
    });
  }

  notifyStreakLoss(studentId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/students/notify-streak-loss/`, { student_id: studentId });
  }
  
  sendLowAttendanceEmail(payload: {
    branch: string;
    year: string;
    semester: string;
    from_date: string;
    to_date: string;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/crc/send-low-attendance-email/`, payload);
  }
  
  requestSubjectCompletion(subjectId: number, headers: HttpHeaders): Observable<any> {
    return this.http.post(`${this.baseUrl}/faculty/request-completion/${subjectId}/`, {}, { headers });
  }
  
  getPendingCompletions(headers: HttpHeaders): Observable<any[]> {  
    return this.http.get<any[]>(`${this.baseUrl}/crc/pending-completion-subjects/`, { headers });
  }
  
  approveSubjectCompletion(allocationId: number, headers: HttpHeaders): Observable<any> {
    return this.http.post(`${this.baseUrl}/crc/approve-completion-subject/${allocationId}/`, {}, { headers });
  }
  
  upgradeStudents(payload: any, headers: HttpHeaders) {
    return this.http.post(`${this.baseUrl}/crc/upgrade-students/`, payload, { headers });
  }
  
}
