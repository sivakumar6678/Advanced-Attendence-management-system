import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-teacher-dashboard',
  templateUrl: './teacher-dashboard.component.html',
  styleUrls: ['./teacher-dashboard.component.css']
})
export class TeacherDashboardComponent implements OnInit {
  teacherProfile: any;
  activePage: string = 'home'; // Default section
  currentTime: string = '';
  sidebarHidden: boolean = false; // Sidebar toggle state

  constructor(
    private teacherDashboardService: UserService,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.updateTime();
    setInterval(() => this.updateTime(), 60000); // Update time every minute
  }

  loadDashboard() {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('access_token')}`);
    this.teacherDashboardService.getFacultyProfile(headers).subscribe(
      (data) => {
        this.teacherProfile = data;
        console.log('Teacher Profile:', this.teacherProfile);
      },
      (error) => {
        console.error('Authorization failed', error);
        this.router.navigate(['/teacher/login']); // Redirect if unauthorized
      }
    );
  }

  updateTime() {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  toggleSidebar() {
    this.sidebarHidden = !this.sidebarHidden;
  }

  menuItems = [
    { label: 'Home', icon: 'pi pi-home', command: () => this.setActivePage('home') },
    { label: 'Timetable', icon: 'pi pi-calendar', command: () => this.setActivePage('timetable') },
    { label: 'Attendance', icon: 'pi pi-check-square', command: () => this.setActivePage('attendance') },
    { label: 'Students', icon: 'pi pi-users', command: () => this.setActivePage('students') },
    { separator: true },
    { label: 'Logout', icon: 'pi pi-sign-out', command: () => this.confirmLogout() }
  ];

  setActivePage(page: string) {
    this.activePage = page;
  }

  logout() {
    localStorage.removeItem('access_token');
    this.router.navigate(['/teacher/login']);
  }

  confirmLogout() {
    this.messageService.add({ key: 'confirm', sticky: true, severity: 'warn', summary: 'Confirm Logout?', detail: 'Are you sure you want to logout?' });
  }

  onConfirm() {
    this.messageService.clear('confirm');
    this.logout();
  }

  onReject() {
    this.messageService.clear('confirm');
  }
}