import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import * as FingerprintJS from '@fingerprintjs/fingerprintjs';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://127.0.0.1:8000/api'; // Adjust if needed
  private deviceId: string | null = null;

  constructor(private http: HttpClient) {
    this.generateDeviceId();
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

  private async generateDeviceId() {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    this.deviceId = result.visitorId;  // Unique device ID
  }

  async getDeviceId(): Promise<string> {

    if (!this.deviceId) {
      await this.generateDeviceId();
    }
    // console.log('device id',this.deviceId);
    return this.deviceId!;
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
  

  
}
