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
timetable: any;
// students: any;

  teacherProfile: any;
  activePage: string = 'home'; 
  currentTime: string = '';
  publicTimetable: any[] = [];

  year: number | null = null;
  semester: number | null = null;
  academicYear: string | null = null;
  branch: string | null = null;

  assignedSubjects: any[] = [];
  groupedSubjects: { [key: string]: any[] } = {};  
  subjectTimetable: { [key: string]: any[] } = {}; 
  activeBatch: string | null = null; 

  selectedSubject: any = null;
  selectedBatchKey: string | null = null;

  subjectsList: any[] = [];
  facultyList: any[] = [];

  crcId: number | null = null ;
  
  days: string[] = [];
  timeSlots: { time: string }[] = [];

  // ✅ Selected Subject
  selectedSubjectId: number | null = null;

  // ✅ Active Section (Timetable, Attendance, or Students)
  activeSection: string = '';
  
  selectedSubjectForAttendance: any = null;
  selectedSubjectForReport: any = null;
  selectedSubjectTimetable: any[] = [];
  // ✅ Section Tabs
  sectionTabs = [
    { key: 'timetable', label: 'Timetable' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'students', label: 'Students' }
  ];
  selectedFacultyId: any;

  subjectId = 0; // Change dynamically as needed
  startDate = '2025-04-01';
  endDate = '2025-04-30';
  

  headers: any[] = [];
  students: any[] = [];
  editedAttendance: { student_id: number; session_id: number; status: string }[] = [];
  editMode: boolean = false;

  constructor(
    private teacherDashboardService: UserService,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.fetchTimetableConfig();  
    this.updateTime();
    this.fetchMatrix();
    setInterval(() => this.updateTime(), 60000);
  }

  menuItems = [
    { label: 'Home', icon: 'fas fa-home', command: () => this.setActivePage('home') },
    { label: 'Timetable', icon: 'fas fa-calendar', command: () => this.setActivePage('timetable') },
    { label: 'Attendance', icon: 'fas fa-check-square', command: () => this.setActivePage('attendance') },
    { label: 'Students', icon: 'fas fa-users', command: () => this.setActivePage('students') },
    { separator: true },
    { label: 'Logout', icon: 'fas fa-sign-out', command: () => this.confirmLogout() }
  ];

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
        this.router.navigate(['/teacher-auth']);
      }
    );
  }
  selectSubject(subject: any): void {
    if (!subject) return;
  
    this.selectedSubject = subject;
    this.selectedBatchKey = `${subject.year} Year - Sem ${subject.semester} (${subject.branch}, ${subject.academic_year})`;
    
    this.activeBatch = null; // ✅ Auto-close timetable
  }
  onSubjectChange() {
    this.activeSection = ''; // Reset active section when a new subject is selected
  }

  // ✅ Set Active Section (Timetable, Attendance, or Students)
  setActiveSection(section: string) {
    this.activeSection = section;
  }
  
  fetchTimetableConfig(): void {
    this.teacherDashboardService.getTimetableConfig().subscribe(
      (data) => {
        console.log("Timetable Config:", data);
        this.days = data.days || [];  
        this.timeSlots = data.time_slots.map((time: string) => ({ time })) || [];
      },
      (error) => {
        console.error("Error fetching timetable config:", error);
      }
    );
  }

  loadAssignedSubjects(facultyId: number): void {
    this.teacherDashboardService.getAssignedSubjects(facultyId).subscribe(
      (data) => {
        console.log("Assigned Subjects (Before Removing Duplicates):", data);
        if (data.length > 0 && data[0].crc_id !== undefined) {
          this.crcId = data[0].crc_id;
          console.log("crc id", this.crcId);
          // Call loadSubjectsAndFaculties after setting crcId
          this.loadSubjectsAndFaculties(this.crcId);
        } else {
          console.error("crc_id not found in the response data");
        }

        const uniqueSubjectsMap = new Map();  
        data.forEach((subject: any) => {
          const key = `${subject.subject_id}-${subject.year}-${subject.semester}-${subject.branch}-${subject.academic_year}`;
          if (!uniqueSubjectsMap.has(key)) {
            uniqueSubjectsMap.set(key, subject);
          }
        });

        this.assignedSubjects = Array.from(uniqueSubjectsMap.values());
        console.log("Unique Assigned Subjects:", this.assignedSubjects);
        this.groupSubjectsByBatch();
      },
      (error) => {
        console.error("Error fetching assigned subjects:", error);
      }
    );
  }

loadSubjectsAndFaculties(crcId: number | null): void {
    if (crcId === null) {
      console.error("crcId is null, cannot load subjects.");
      return; // Early return if crcId is null
    }

    // ✅ Fetch subjects list
    this.teacherDashboardService.getSubjects(crcId).subscribe(
      (data) => {
        this.subjectsList = data;
        console.log("Subjects List:", this.subjectsList);
      },
      (error) => {
        console.error("Error fetching subjects list:", error);
      }
    );

    // ✅ Fetch faculty list
    this.teacherDashboardService.getFaculties().subscribe(
      (data) => {
        this.facultyList = data;
        console.log("Faculty List:", this.facultyList);
      },
      (error) => {
        console.error("Error fetching faculty list:", error);
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

  loadPublicTimetable(subject: any, callback?: () => void): void {
    console.log("Fetching timetable for:", subject);
    
    if (!subject.year || !subject.semester || !subject.branch || !subject.academic_year) {
      console.error("Missing required parameters to fetch timetable.");
      return;
    }

    const batchKey = `${subject.year} Year - Sem ${subject.semester} (${subject.branch}, ${subject.academic_year})`;

    if (this.activeBatch === batchKey) {
      this.activeBatch = null; // ✅ Close timetable if already open
      return;
    }

    this.teacherDashboardService.getPublicTimetables(subject.year, subject.semester, subject.branch, subject.academic_year)
      .subscribe(
        (data) => {
          console.log("Public Timetable for subject:", subject.subject_name, data);
          
          if (data.length > 0 && data[0].entries) {
            this.subjectTimetable[batchKey] = data[0].entries;
            this.activeBatch = batchKey;
          } else {
            console.warn("No timetable found for subject:", subject.subject_name);
            this.subjectTimetable[batchKey] = [];
          }

          // ✅ Call callback after fetching timetable
          if (callback) {
            callback();
          }
        },
        (error) => {
          console.error("Error fetching public timetable:", error);
          if (callback) {
            callback();
          }
        }
      );
}

  toggleTimetable(batchKey: string): void {
    this.activeBatch = this.activeBatch === batchKey ? null : batchKey;
  }

  getSubjectName(subjectId: number | null): string {
    if (!subjectId) return 'Unknown'; // Return 'Unknown' if ID is null
    
    // Check if the subject is already cached
    const cachedSubject = this.subjectsList.find(s => Number(s.id) === Number(subjectId));
    if (cachedSubject) {
      return cachedSubject.name;
    }
  
    // Fetch the subject name if not cached
    this.teacherDashboardService.getSubjectById(subjectId).subscribe(
      (data) => {
        this.subjectsList.push(data);  // ✅ Cache the subject to avoid duplicate API calls
      },
      (error) => {
        console.error("Error fetching subject name:", error);
      }
    );
  
    return 'Loading...'; // Placeholder text while fetching
  }

  getFacultyName(facultyId: number | null): string {
    if (!facultyId) return 'Unknown';
    const faculty = this.facultyList.find(f => f.id === facultyId);
    return faculty ? faculty.full_name : 'Unknown Faculty';
  }

  updateTime() {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  

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

  getTimetableEntries(batchKey: string, day: string, timeSlot: string): any[] {
    return this.subjectTimetable[batchKey]?.filter(entry => entry.day === day && entry.time_slot === timeSlot) || [];
  }

  hasTimetableEntry(batchKey: string, day: string, timeSlot: string): boolean {
    return this.subjectTimetable[batchKey]?.some(entry => entry.day === day && entry.time_slot === timeSlot) ?? false;
  }

  getEntries(batchKey: string, day: string, time: string): any[] {
    return (this.subjectTimetable[batchKey] || []).filter(entry => entry.day === day && entry.time_slot === time);
  }
  
  goToAttendance(subject: any) {
    this.selectedSubjectForAttendance = subject;
    this.selectedSubjectForReport = null;  // Ensure report is not shown at the same time
    this.activeSection = 'attendance';  // ✅ Mark attendance section as active

    const batchKey = `${subject.year} Year - Sem ${subject.semester} (${subject.branch}, ${subject.academic_year})`;

    // ✅ Check if timetable is already loaded
    if (this.subjectTimetable[batchKey] && this.subjectTimetable[batchKey].length > 0) {
        this.selectedSubjectTimetable = this.subjectTimetable[batchKey];
        console.log("✅ Passing Timetable to Attendance:", this.selectedSubjectTimetable);
    } else {
        console.warn("⚠️ Timetable not found. Fetching from server...");
        
        // ✅ Fetch timetable before setting it in attendance
        this.loadPublicTimetable(subject, () => {
            this.selectedSubjectTimetable = this.subjectTimetable[batchKey] || [];
            console.log("✅ Timetable Loaded & Passed to Attendance:", this.selectedSubjectTimetable);
        });
    }
    this.selectedFacultyId = this.teacherProfile.id;  
}


filterByDateRange() {
  if (this.startDate && this.endDate && this.selectedSubjectForReport) {
    const formattedStartDate = new Date(this.startDate).toISOString().split('T')[0];
    const formattedEndDate = new Date(this.endDate).toISOString().split('T')[0];

    const subjectId = this.selectedSubjectForReport.id;

    this.fetchMatrix(subjectId, formattedStartDate, formattedEndDate);
    console.log("Filtered Attendance Matrix:", this.headers, this.students);
  }
}


  toggleEditMode() {
  this.editMode = !this.editMode;
}
  // ✅ Show the Student Reports Component inside the dashboard
  goToStudentReports(subject: any) {
    this.selectedSubjectForReport = subject;
    console.log("Selected Subject for Report:", this.selectedSubjectForReport);
    this.selectedSubjectForAttendance = null; // Ensure attendance is not shown at the same time
    this.activeSection = 'students';  // ✅ Mark students section as active
    this.editMode = false; // Ensure edit mode is off when viewing reports
    this.fetchMatrix(subject.subject_id); // Fetch the attendance matrix for the selected subject
  }

  fetchMatrix(subject_id: number = this.subjectId, formattedStartDate: string = this.startDate, formattedEndDate: string = this.endDate) {
    this.subjectId = subject_id; // Update the subject ID
    this.teacherDashboardService.getAttendanceMatrix(this.subjectId, formattedStartDate, formattedEndDate).subscribe((data: any) => {
      this.headers = data.headers;
      this.students = data.students;
    });
  }

  updateStatus(studentId: number, sessionId: number, newStatus: string) {
    const index = this.editedAttendance.findIndex(
      record => record.student_id === studentId && record.session_id === sessionId
    );

    if (index > -1) {
      this.editedAttendance[index].status = newStatus;
    } else {
      this.editedAttendance.push({ student_id: studentId, session_id: sessionId, status: newStatus });
    }
  }

  saveChanges() {
    this.teacherDashboardService.updateAttendanceMatrix(this.editedAttendance).subscribe(() => {
      alert('Attendance updated successfully!');
      this.editedAttendance = [];
      this.fetchMatrix(); // refresh after save
      setTimeout(() => {
      this.toggleEditMode(); // exit edit mode
      }
      , 1000); // Delay to allow user to see the message

    });
  }

}
