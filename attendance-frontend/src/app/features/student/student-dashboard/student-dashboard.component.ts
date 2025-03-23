import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { Router } from '@angular/router';
import { HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-student-dashboard',
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.css']
})
export class StudentDashboardComponent implements OnInit {
  studentProfile: any;
  attendanceStatus = "Present";
  attendancePercentage = 85;
  publicTimetable: any[] = [];
  activeSection: string = 'dashboard'; // Default section

  activeAttendanceSession: any = null; // Dummy data for attendance session
  attendanceReports: any[] = [
    { date: "2025-03-01", status: "Present" },
    { date: "2025-03-02", status: "Absent" },
    { date: "2025-03-03", status: "Present" }
  ];

  year: number | null = null;
  semester: number | null = null;
  academicYear: string | null = null;
  branch: string | null = null;

  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchStudentProfile();
    setTimeout(() => {
      this.activeAttendanceSession = { subject: "CNS", faculty: "Dr. Smith" };
    }, 3000);
    // console.log('Student ID:', this.studentProfile);
  }
  

  fetchStudentProfile(): void {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('access_token')}`);
    this.userService.getStudentProfile(headers).subscribe(
      (data) => {
        this.studentProfile = data;
        console.log('Student Profile:', this.studentProfile);
  
        this.year = this.studentProfile.year;
        this.semester = this.studentProfile.semester;
        this.academicYear = this.studentProfile.academic_year;
        this.branch = this.studentProfile.branch;
  
        // ✅ Call loadPublicTimetable() only after student data is set
        if (this.year && this.semester && this.academicYear && this.branch) {
          this.loadPublicTimetable();
        } else {
          console.error("Missing student profile details. Public timetable cannot be loaded.");
        }
      },
      (error) => {
        console.error('Authorization failed', error);
        this.router.navigate(['/student-auth']);
      }
    );
  }
  

  loadPublicTimetable(): void {
    console.log("Loading timetable from backend: ", this.year, this.semester, this.branch, this.academicYear);
  
    if (!this.year || !this.semester || !this.branch || !this.academicYear) {
      console.error("Missing required parameters to fetch timetable.");
      return;
    }
  
    this.userService.getPublicTimetables(this.year, this.semester, this.branch, this.academicYear)
      .subscribe(
        (data) => {
          console.log("Public Timetable:", data);
          
          if (data.length > 0 && data[0].entries) {
            this.publicTimetable = data[0].entries;  // ✅ Extract `entries` correctly
          } else {
            console.warn("No timetable found for the given details.");
            this.publicTimetable = [];  // ✅ Ensure array is empty if no data
          }
        },
        (error) => {
          console.error("Error fetching public timetable:", error);
        }
      );
  }

  

  setActiveSection(section: string): void {
    this.activeSection = section;
  }
  getSubjectName(subjectId: number | null): string {
    if (!subjectId) return 'Unknown';
    return `Subject ${subjectId}`;  // Replace this with a real lookup if needed
  }
  
  getFacultyName(facultyId: number | null): string {
    if (!facultyId) return 'Unknown';
    return `Faculty ${facultyId}`;  // Replace this with a real lookup if needed
  }
  
  
  
  logout(): void {
    localStorage.removeItem('access_token');
    this.router.navigate(['/student/login']);
  }

  
}
