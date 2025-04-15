import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';

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

  pendingRequests: any[] = [];
  pendingCompletions: any[] = [];

  upgradePayload = {
    branch_id: 0, // Default numeric value
    year: 0,      // Default numeric value
    semester: 0,  // Default numeric value
    academic_year_id: 0 // Default numeric value
  };
  isUpgrading = false;
  constructor(private crcDashboardService: UserService, 
              private crcauthService: AuthService,
              private router: Router, 
              private messageService: MessageService) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.updateTime();
    setInterval(() => this.updateTime(), 60000); // Update time every minute
    this.loadPendingRequests();
    this.loadPendingCompletionRequests();
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
    {label: 'Upgrade', icon: 'fas fa-arrow-up', command: () => this.setActivePage('Upgrade')},

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

  loadPendingRequests() {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('access_token')}`);
    this.crcauthService.getPendingDeviceRequests(headers).subscribe(
      (data) => {
        this.pendingRequests = data;
        console.log('Pending Requests:', this.pendingRequests);
      },
      (error) => {
        console.error('Error fetching pending requests', error);
      }
    );
  }
   
  
  handleDeviceRequest(id: number, action: 'approved' | 'rejected') {
    this.crcauthService.approveOrRejectDeviceRequest(id, action).subscribe(
      res => {
        alert(res.detail); // success
        this.loadPendingRequests(); // reload after update
      },
      err => {
        console.error('Error:', err);
        alert('Error: ' + (err.error?.detail || 'Something went wrong'));
      }
    );
  }

  loadPendingCompletionRequests(): void {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('access_token')}`);
  
    this.crcDashboardService.getPendingCompletions(headers).subscribe(
      (data) => {
        this.pendingCompletions = data;
        console.log("Pending completion requests:", this.pendingCompletions);
      },
      (error) => {
        console.error("Error fetching pending completions:", error);
      }
    );
  }

  // approveSubject(allocationId: number) {
  //   const headers = new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('access_token')}`);
  //   this.crcDashboardService.approveSubjectCompletion(allocationId, headers).subscribe(
  //     () => {
  //       // console.log("Subject marked as completed:", allocationId);
  //       this.messageService.add({ key:'main-toast', severity: 'success', summary: 'Approved', detail: 'Subject marked as completed.' });
  //       this.loadPendingCompletionRequests(); // Refresh list
  //     },
  //     (error) => {
  //       this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to approve.' });
  //       console.error("Approval error:", error);
  //     }
  //   );
  // }
  approveSubject(allocationId: number) {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('access_token')}`);
    this.crcDashboardService.approveSubjectCompletion(allocationId, headers).subscribe(
      () => {
        this.messageService.add({ key:'main-toast', severity: 'success', summary: 'Approved', detail: 'Subject marked as completed.' });
        this.loadPendingCompletionRequests(); // Refresh list
      },
      (error) => {
        let errorMessage = 'Failed to approve.';
        if (error.status === 409) {
          errorMessage = 'Subject already completed.';
        }
        this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMessage });
        console.error("Approval error:", error);
      }
    );
}
  upgradeStudents() {
    if (!this.crcProfile) {
      alert('CRC profile not loaded. Try reloading the page.');
      return;
    }
  
    const payload = {
      branch_id: this.crcProfile.branch_id,
      year: this.crcProfile.year,
      semester: this.crcProfile.semester,
      academic_year: this.crcProfile.academic_year
    };
  
    const headers = new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('access_token')}`);
  
    this.isUpgrading = true;
    this.crcDashboardService.upgradeStudents(payload, headers).subscribe({
      next: () => {
        alert('✅ Students successfully upgraded to the next semester/year!');
        this.isUpgrading = false;
      },
      error: (err) => {
        console.error('Upgrade failed:', err);
        alert('❌ Failed to upgrade students.');
        this.isUpgrading = false;
      }
    });
  }
  

}