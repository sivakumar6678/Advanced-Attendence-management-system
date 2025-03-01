import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-crc-dashboard',
  templateUrl: './crc-dashboard.component.html',
  styleUrls: ['./crc-dashboard.component.css']
})
export class CrcDashboardComponent implements OnInit {
  crcProfile: any;
  activePage: string = 'home'; // Default section
  
  
  ngOnInit(): void {
    this.loadDashboard();
    
   
  }
   loadDashboard() {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('access_token')}`);
    this.crcDashboardService.getCrcProfile(headers).subscribe(
      (data) => {
        this.crcProfile = data;
        console.log('CRC Profile:', this.crcProfile);
      },
      (error) => {
        console.error('Authorization failed', error);
        this.router.navigate(['/crc/login']);
      }
    );
   
  }

    menuItems = [
    { label: 'Home', icon: 'fas fa-home', command: () => this.setActivePage('home') },
    { label: 'Profile', icon: 'fas fa-user', command: () => this.setActivePage('profile') },
    { label: 'Timetable', icon: 'fas fa-calendar', command: () => this.setActivePage('timetable') },
    { label: 'Attendance', icon: 'fas fa-check-square', command: () => this.setActivePage('attendance') },
    { label: 'Notifications', icon: 'fas fa-bell', command: () => this.setActivePage('notifications') },
    { label: 'Logout', icon: 'fas fa-sign-out', command: () => this.logout() }
  ];
  setActivePage(page: string) {
    this.activePage = page;
  }
  
  constructor(private crcDashboardService: UserService, private router: Router) {}


  approveRequest(requestId: number, type: string): void {
    console.log(`Approved ${type} request:`, requestId);
    alert(`${type} request approved!`);
  }

  logout() {
    localStorage.removeItem('access_token');
    this.router.navigate(['/crc-auth']);
  }
}