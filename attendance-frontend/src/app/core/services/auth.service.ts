import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient,HttpHeaders } from '@angular/common/http';
import * as FingerprintJS from '@fingerprintjs/fingerprintjs';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://127.0.0.1:8000/api'; // Adjust if needed
  private deviceId: string | null = null;

  constructor(private http: HttpClient) {
    this.getDeviceId();
  }

  async getDeviceName(): Promise<string> {
    const userAgent = navigator.userAgent;
    if (/Android/i.test(userAgent)) return "Android Device";
    if (/iPhone|iPad|iPod/i.test(userAgent)) return "iOS Device";
    return "Unknown Device";
  }
  // Get Device Type
  async getDeviceType(): Promise<string> {
    const width = window.innerWidth;
    return width <= 768 ? "Mobile" : "Desktop";
  }

  // Get Platform (OS)
  async getPlatform(): Promise<string> {
      return navigator.platform || "Unknown";
  }
  // Get Browser Info
  async getBrowserInfo() {
      const userAgent = navigator.userAgent;
      if (userAgent.includes("Firefox")) return "Firefox";
      if (userAgent.includes("Chrome")) return "Chrome";
      if (userAgent.includes("Safari")) return "Safari";
      if (userAgent.includes("Edge")) return "Edge";
      if (userAgent.includes("Opera") || userAgent.includes("OPR")) return "Opera";
      return "Unknown Browser";
  }

  // Get OS Version
  async getOSVersion() {
      const userAgent = navigator.userAgent;
      if (/android/i.test(userAgent)) return "Android " + (userAgent.match(/Android\s([\d.]+)/)?.[1] || "Unknown");
      if (/iPhone|iPad|iPod/i.test(userAgent)) return "iOS " + (userAgent.match(/OS\s([\d_]+)/)?.[1]?.replace(/_/g, '.') || "Unknown");
      return "Unknown OS";
  }
  // Get Screen Resolution
  getScreenResolution(): string {
    return `${window.screen.width}x${window.screen.height}`;
  }
  async getIpAddress(): Promise<string> {
    try {
      const response = await this.http.get<any>('https://api64.ipify.org?format=json').toPromise();
      return response.ip;
    } catch (error) {
      return 'Unknown IP';
    }
  }
  
  // Helper function to check if the device is mobile
  private isMobileDevice(deviceName: string): boolean {
    return deviceName === 'Android Device' || deviceName === 'iPhone';
  }



  async getDeviceId(): Promise<string> {
    if (localStorage.getItem('device_id')) {
      return localStorage.getItem('device_id')!; // ✅ Return stored device ID if available
    }
  
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    const userAgent = navigator.userAgent;
    const screenResolution = `${window.screen.width}x${window.screen.height}`;
  
    const generatedDeviceId = `${result.visitorId}-${userAgent}-${screenResolution}`;
  
    localStorage.setItem('device_id', generatedDeviceId); // ✅ Store it so it remains the same
    return generatedDeviceId;
  }
  


  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private getAuthHeaders() {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Student Registraiton api
  registerStudent(data: any): Observable<any> {
    const body = { ...data };
    console.log(body);
    console.log('registering student');
    return this.http.post(`${this.baseUrl}/students/register/`, body);

    // return this.http.post('/api/students/register', body);
  }
// Student login api
  loginStudent(data: any): Observable<any> {
    const body = { ...data };
    console.log("login student",body);
    return this.http.post(`${this.baseUrl}/students/login/`,{
      ...body,
      headers : this.getAuthHeaders()
    });
    // return this.http.post('/api/students/login', body);
  }

  // Faculty login api
  login(email: string, password: string): Observable<any> {
    // console.log("email and passwrod",email,password);
    return this.http.post(`${this.baseUrl}/faculty/login/`, { email, password });
  }
  // Faculty registration api
  register(data: any): Observable<any> {
    // console.log("registering faculty",data);
    return this.http.post(`${this.baseUrl}/faculty/register/`, data);
  }

  // CRC registration api
  registerCRC(data: any): Observable<any> {
    console.log("registering crc",data);
    return this.http.post(`${this.baseUrl}/crc/register/`, data);
  }
//  CRC login api
  loginCRC(credentials: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/crc/login/`, {
      ...credentials,
      headers : this.getAuthHeaders()
    });
  }
  fetchFacultyDetails(email: string, employeeId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/crc/faculty-details/?email=${email}&employee_id=${employeeId}`);
  }
  logoutCRC(): Observable<any> {
    return this.http.get(`${this.baseUrl}/crc/logout/`);
  }
  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
  
  getPendingDeviceRequests(headers: HttpHeaders): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/crc/device-requests/`, { headers }); 
  }
  approveOrRejectDeviceRequest(requestId: number, action: 'approved' | 'rejected'): Observable<any> {
    const url = `${this.baseUrl}/crc/device-approve/${requestId}/`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
    });
  
    const body = {
      action: action // ✅ Send as object with correct key
    };
    console.log("body",body);
    
    return this.http.patch<any>(url, body, { headers });
  }
  
  sendOtpToEmail(email: string): Observable<any> {
    const csrfToken = this.getCSRFToken() || '';
    const headers = new HttpHeaders({
      'X-CSRFToken': csrfToken,
      'Content-Type': 'application/json',
    });

    const body = { email: email };

    return this.http.post('http://127.0.0.1:8000/api/students/send-otp-to-email/', body, { headers });
  }

  private getCSRFToken(): string | null {
    const csrfToken = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
    return csrfToken ? csrfToken.split('=')[1] : null;
  }
  

  // Verify OTP entered by the user
  verifyOtp(email: string, otp: string): Observable<any> {
    const csrfToken = this.getCookie('csrftoken');

    const headers = new HttpHeaders({
      'X-CSRFToken': csrfToken || ''
    });

    return this.http.post<any>(`${this.baseUrl}/students/verify-otp/`, { email, otp }, { headers });
  }

  // Utility function to get a cookie by name (for CSRF token)
  private getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  }

  sendDeviceRequest(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/students/device-re-registration/`, data);
}

loginSuperAdmin(email: string, password: string): Observable<any> {
  return this.http.post(`${this.baseUrl}/core/superadmin/login/`, { email, password });
}
getFacultyList(): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseUrl}/core/superadmin/faculty-list/`);
}
addFaculty(faculty: any): Observable<any> {
  return this.http.post(`${this.baseUrl}/core/superadmin/add-faculty/`, faculty);
}
getBranches(): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseUrl}/core/branches/`);
}

addBranch(branch: any): Observable<any> {
  return this.http.post(`${this.baseUrl}/core/branches/`, branch);
}

updateBranch(id: number, branch: any): Observable<any> {
  return this.http.put(`${this.baseUrl}/core/branches/${id}/`, branch);
}

deleteBranch(id: number): Observable<any> {
  return this.http.delete(`${this.baseUrl}/core/branches/${id}/`);
}
getAcademicYears(): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseUrl}/core/academic-years/`);
}

addAcademicYear(year: any): Observable<any> {
  return this.http.post(`${this.baseUrl}/core/academic-years/`, year);
}
loadAcademicYear(id: number): Observable<any> {
  return this.http.get(`${this.baseUrl}/core/academic-years/${id}/`);
}
updateAcademicYear(id: number, year: any): Observable<any> {
  return this.http.put(`${this.baseUrl}/core/academic-years/${id}/`, year);
}

deleteAcademicYear(id: number): Observable<any> {
  return this.http.delete(`${this.baseUrl}/core/academic-years/${id}/`);
}

}
