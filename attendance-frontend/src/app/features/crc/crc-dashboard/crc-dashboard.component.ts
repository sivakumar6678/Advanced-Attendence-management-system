import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-crc-dashboard',
  templateUrl: './crc-dashboard.component.html',
  styleUrls: ['./crc-dashboard.component.css']
})
export class CrcDashboardComponent implements OnInit {
  crcProfile: any;
  activePage: string = 'home'; // Default section
  visible: boolean = false;
  currentTime: string = '';
  sidebarHidden: boolean = false; // Sidebar toggle state

  constructor(private crcDashboardService: UserService, private router: Router, private messageService: MessageService) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.updateTime();
    setInterval(() => this.updateTime(), 60000); // Update time every minute
  }
  
  loadDashboard() {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('access_token')}`);
    this.crcDashboardService.getCrcProfile(headers).subscribe(
      (data) => {
        this.crcProfile = data;
        console.log('CRC Profile:', this.crcProfile);
        this.crcDashboardService.setCRCDetails(this.crcProfile);
      },
      (error) => {
        console.error('Authorization failed', error);
        // this.router.navigate(['/crc-auth']);
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
    { label: 'Home', icon: 'fas fa-home', command: () => this.setActivePage('home') },
    { label: 'Timetable', icon: 'fas fa-calendar', command: () => this.setActivePage('timetable') },
    { label: 'Attendance', icon: 'fas fa-check-square', command: () => this.setActivePage('attendance') },
    { label: 'Notifications', icon: 'fas fa-bell', command: () => this.setActivePage('notifications') },
    { separator: true },
    { label: 'Logout', icon: 'fas fa-sign-out', command: () => this.confirmLogout() }
  ];

  setActivePage(page: string) {
    this.activePage = page;
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.clear();
    this.router.navigate(['/crc-auth']);
  }

  confirmLogout() {
    this.messageService.add({ key: 'confirm', sticky: true, severity: 'warn', summary: 'Confirm Logout?', detail: 'Are you sure you want to logout?' });
    this.visible = true;
  }
  
  onConfirm() {
    this.messageService.clear('confirm');
    this.visible = false;
    setTimeout(() => {
      this.logout();
    }, 1000);
  }

  onReject() {
    this.messageService.clear('confirm');
    this.visible = false;
  }
}
