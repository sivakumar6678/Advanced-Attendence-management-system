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
  publicTimetable: any[] = [];

  year: number | null = null;
  semester: number | null = null;
  academicYear: string | null = null;
  branch: string | null = null;

  assignedSubjects: any[] = [];
  groupedSubjects: { [key: string]: any[] } = {};  // ✅ Store subjects grouped by (year, semester, branch)
  subjectTimetable: { [key: string]: any[] } = {}; // ✅ Store timetable per batch
  activeBatch: string | null = null; // ✅ Track which timetable is active


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
        this.loadAssignedSubjects(this.teacherProfile.id);
      },
      (error) => {
        console.error('Authorization failed', error);
        this.router.navigate(['/teacher-auth']); // Redirect if unauthorized
      }
    );
  }

  loadAssignedSubjects(facultyId: number): void {
    this.teacherDashboardService.getAssignedSubjects(facultyId).subscribe(
      (data) => {
        console.log("Assigned Subjects (Before Removing Duplicates):", data);

        // ✅ Remove duplicate subjects (Group by subject_id, year, semester, branch)
        const uniqueSubjects = data.reduce((acc: { [key: string]: any }, subject: any) => {
          const key = `${subject.subject_id}-${subject.year}-${subject.semester}-${subject.branch}-${subject.academic_year}`;
          if (!acc[key]) {
            acc[key] = subject;
          }
          return acc;
        }, {} as { [key: string]: any });
        
        

        this.assignedSubjects = Object.values(uniqueSubjects);
        console.log("Unique Assigned Subjects:", this.assignedSubjects);

        // ✅ Group subjects by (year, semester, branch)
        this.groupSubjectsByBatch();

      },
      (error) => {
        console.error("Error fetching assigned subjects:", error);
      }
    );
  }

  groupSubjectsByBatch() {
    this.groupedSubjects = {};
    this.assignedSubjects.forEach(subject => {
      const batchKey = `${subject.year} Year - Sem ${subject.semester} (${subject.branch}, ${subject.academic_year})`;
      
      if (!this.groupedSubjects[batchKey]) {
        this.groupedSubjects[batchKey] = [];
      }
      this.groupedSubjects[batchKey].push(subject);
    });

    console.log("Grouped Subjects by Batch:", this.groupedSubjects);
  }

  loadPublicTimetable(subject: any): void {
    console.log("Fetching timetable for:", subject);
  
    if (!subject.year || !subject.semester || !subject.branch || !subject.academic_year) {
      console.error("Missing required parameters to fetch timetable.");
      return;
    }
  
    // ✅ Define batchKey before using it
    const batchKey = `${subject.year} Year - Sem ${subject.semester} (${subject.branch}, ${subject.academic_year})`;
  
    this.teacherDashboardService.getPublicTimetables(subject.year, subject.semester, subject.branch, subject.academic_year)
      .subscribe(
        (data) => {
          console.log("Public Timetable for subject:", subject.subject_name, data);
          
          if (data.length > 0 && data[0].entries) {
            this.subjectTimetable[batchKey] = data[0].entries;
            this.activeBatch = batchKey;  // ✅ Correctly set active batch
          } else {
            console.warn("No timetable found for subject:", subject.subject_name);
            this.subjectTimetable[batchKey] = [];
          }
        },
        (error) => {
          console.error("Error fetching public timetable:", error);
        }
      );
  }
  

  toggleTimetable(batchKey: string): void {
    this.activeBatch = this.activeBatch === batchKey ? null : batchKey;
  }
  


  viewSubjectDetails(subject: any): void {
    console.log("Viewing subject:", subject);
    // Navigate to subject details page (implement routing later)
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
    { label: 'Students', icon: 'fas fa-users', command: () => this.setActivePage('students') },
    { separator: true },
    { label: 'Logout', icon: 'fas fa-sign-out', command: () => this.confirmLogout() }
  ];

  setActivePage(page: string) {
    this.activePage = page;
  }

  logout() {
    localStorage.removeItem('access_token');
    this.router.navigate(['/teacher-auth']);
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



  getSubjectName(subjectId: number | null): string {
    if (!subjectId) return 'Unknown';
    return `Subject ${subjectId}`;  // Replace this with a real lookup if needed
  }
  
  getFacultyName(facultyId: number | null): string {
    if (!facultyId) return 'Unknown';
    return `Faculty ${facultyId}`;  // Replace this with a real lookup if needed
  }
  
  
  
  
}