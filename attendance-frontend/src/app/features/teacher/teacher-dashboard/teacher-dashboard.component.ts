import { Component, OnInit,ViewChild } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-teacher-dashboard',
  templateUrl: './teacher-dashboard.component.html',
  styleUrls: ['./teacher-dashboard.component.css']
})
export class TeacherDashboardComponent implements OnInit {
timetable: any;
@ViewChild('dt') dt: any;

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

  displayDownloadDialog = false;
  downloadFileName: string = 'Attendance_Report';

  searchQuery: string = '';
  minPercentage: number | null = null;
  filteredStudents: any[] = [];
  originalStudents: any[] = [];

  subjects: any[] = [];

  submittingSubjects: Set<number> = new Set();
  subject_status : any;


  activeSubjects: any[] = [];
  completionRequestedSubjects: Set<number> = new Set(); 
  completedSubjects: any[] = [];
  activeGroupedSubjects: { [key: string]: any[] } = {};
  subjectsMap: Map<number, any> = new Map();



  constructor(
    private teacherDashboardService: UserService,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService

  ) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.fetchTimetableConfig();  
    this.updateTime();
    this.fetchMatrix();
    setInterval(() => this.updateTime(), 60000);
    // this.getstubjectStatus();
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
    this.teacherDashboardService.getAssignedSubjects(facultyId).subscribe({
      next: (data) => {
        console.log("Assigned Subjects (Raw):", data);
        let foundCrcId = null;
        if (data.length > 0 && data[0].crc_id !== undefined) {
          foundCrcId = data[0].crc_id;
        } else {
          console.error("crc_id not found in assigned subjects response data. Cannot load full subject list.");
           // Handle this case - maybe show an error, or try loading subjects differently?
        }

        // Process assigned subjects (removing duplicates for display grouping)
        const uniqueSubjectsMap = new Map();
        data.forEach((subject: any) => {
          const key = `${subject.subject_id}-${subject.year}-${subject.semester}-${subject.branch}-${subject.academic_year}`;
          if (!uniqueSubjectsMap.has(key)) {
            uniqueSubjectsMap.set(key, subject);
          }
        });

        this.assignedSubjects = Array.from(uniqueSubjectsMap.values());
        console.log("Unique Assigned Subjects (for grouping):", this.assignedSubjects);
        this.groupSubjectsByBatch(); // Group ALL subjects first

        // Now load the full subjects list if CRC ID was found
         if(foundCrcId !== null) {
             this.crcId = foundCrcId; // Set the component property
             console.log("CRC ID set:", this.crcId);
             this.loadSubjectsAndFaculties(this.crcId);
         }
      },
      error: (error) => {
        console.error("Error fetching assigned subjects:", error);
        // Display error to user?
      }
    });
  }
  loadSubjectsAndFaculties(crcId: number | null): void {
    if (crcId === null) {
        console.error("crcId is null, cannot load subjects and faculties.");
        return;
    }
    console.log("Loading subjects and faculties for CRC ID:", crcId);

    // Fetch the complete list of subjects for this CRC (includes status)
    this.teacherDashboardService.getSubjects(crcId).subscribe({
      next: (data) => {
          this.subjectsList = data; // Keep original list if needed
          // *** Create/Update Map for O(1) status lookups ***
          this.subjectsMap.clear();
          this.subjectsList.forEach(s => this.subjectsMap.set(s.id, s));
          console.log("Subjects List fetched and Map created:", this.subjectsMap.size, "entries");
          // This function will now also call updateActiveGroupedSubjects
          this.getSubjectStatus(); // Categorize based on the new list/map
      },
      error: (error) => {
          console.error("Error fetching subjects list:", error);
          this.subjectsMap.clear(); // Clear map on error
          this.getSubjectStatus(); // Update view based on empty data
      }
  });

    // Fetch faculty list (as before)
    this.teacherDashboardService.getFaculties().subscribe({
        next: (data) => {
            this.facultyList = data;
            console.log("Faculty List:", this.facultyList);
        },
        error: (error) => {
            console.error("Error fetching faculty list:", error);
        }
    });
  }


// getstubjectStatus() {
//   console.log("Fetching subject statuses...", this.subjectsList);
//   this.subject_status = this.subjectsList.map(subject => ({
//     id: subject.id,
//     name: subject.name,
//     status: subject.status || 'Unknown' // Default to 'Unknown' if status is not available
//   }));
//   // Organize subjects by status
//   this.activeSubjects = this.subject_status.filter((subject: { status: string }) => subject.status === 'active');
//   this.completedSubjects = this.subject_status.filter((subject: { status: string }) => subject.status === 'completed');
//   console.log("Active Subjects:", this.activeSubjects);
//   console.log("Completed Subjects:", this.completedSubjects);
// }

groupSubjectsByBatch() {
  this.groupedSubjects = {};
  this.assignedSubjects.forEach(subject => { // Iterate the unique assigned subjects
    const batchKey = `${subject.year} Year - Sem ${subject.semester} (${subject.branch}, ${subject.academic_year})`;
    if (!this.groupedSubjects[batchKey]) {
      this.groupedSubjects[batchKey] = [];
    }
    this.groupedSubjects[batchKey].push(subject); // Push the assigned subject object
  });
  console.log("Grouped Subjects by Batch:", this.groupedSubjects);
}

// Renamed from getstubjectStatus for clarity
getSubjectStatus() {
  this.activeSubjects = []; // Reset categorized lists
  this.completedSubjects = [];

  if (this.subjectsMap.size === 0) { // Check the map now
      console.warn("subjectsMap is empty, cannot categorize.");
      this.updateActiveGroupedSubjects(); // Ensure active groups are cleared
      return;
  }
  console.log("Categorizing subject statuses from subjectsMap...");

  // Iterate the map for categorization
  this.subjectsMap.forEach((subject: any, subjectId: number) => {
      const status = subject.status || 'Unknown';
      if (status === 'active' || status === 'completion_requested') {
          this.activeSubjects.push(subject);
      } else if (status === 'completed') {
          this.completedSubjects.push(subject);
      }
  });

  console.log('Categorized Active/Pending Subjects Count:', this.activeSubjects.length);
  console.log('Categorized Completed Subjects (for History):', this.completedSubjects);

  // *** Crucial: Update the filtered grouped list AFTER statuses are known ***
  this.updateActiveGroupedSubjects();
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
  getSubjectStatusById(subjectId: number): string {
    const subject = this.subjectsMap.get(subjectId); // O(1) lookup
    return subject ? (subject.status || 'Unknown') : 'Unknown';
}
updateActiveGroupedSubjects() {
  const newActiveGroupedSubjects: { [key: string]: any[] } = {}; // Create temporary object
  console.log("Updating active grouped subjects view...");

  if (!this.groupedSubjects || Object.keys(this.groupedSubjects).length === 0 || this.subjectsMap.size === 0) {
      console.log("Skipping updateActiveGroupedSubjects - data not ready.");
      this.activeGroupedSubjects = newActiveGroupedSubjects; // Ensure it's reset
      return;
  }

  for (const batchKey in this.groupedSubjects) {
    if (this.groupedSubjects.hasOwnProperty(batchKey)) {
      // Filter subjects in this batch: Keep only non-completed ones
      const activeSubjectsInBatch = this.groupedSubjects[batchKey].filter(subject => {
        const status = this.getSubjectStatusById(subject.subject_id); // Use helper
        return status !== 'completed'; // The filter condition
      });

      // Only add the batch key if there are active/pending subjects
      if (activeSubjectsInBatch.length > 0) {
        newActiveGroupedSubjects[batchKey] = activeSubjectsInBatch;
      }
    }
  }
  // Assign the newly created object to trigger change detection if needed
  this.activeGroupedSubjects = newActiveGroupedSubjects;
  console.log("Active Grouped Subjects (View Filtered):", this.activeGroupedSubjects);
}
// Renamed from handleMarkAsCompleted for clarity
requestCompletion(subjectId: number): void {
  if (!subjectId || this.completionRequestedSubjects.has(subjectId)) return;

  console.log(`Requesting completion for subject ID: ${subjectId}`);
  this.completionRequestedSubjects.add(subjectId);

  const headers = new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('access_token')}`);

  this.teacherDashboardService.requestSubjectCompletion(subjectId, headers).subscribe({
    next: (response) => {
      console.log('Subject completion requested successfully:', response);
      this.messageService.add({ key: 'main-toast', severity: 'success', summary: 'Request Sent', detail: 'Subject completion request sent successfully!', life: 3000 });


      // --- Update local state ---
      // 1. Update status in the Map (this is the source for getSubjectStatusById)
      const subjectInMap = this.subjectsMap.get(subjectId);
      if (subjectInMap) {
        subjectInMap.status = 'completion_requested';
        console.log(`Updated status for subject ${subjectId} to 'completion_requested' in subjectsMap.`);
      }

      // 2. Re-run categorization AND update the active grouped view
      this.getSubjectStatus(); // This correctly updates completedSubjects AND activeGroupedSubjects

      // Optional: remove from processing set if button should re-enable immediately
      this.completionRequestedSubjects.delete(subjectId);

    },
    error: (error) => {
      console.error('Failed to request subject completion:', error);
      this.messageService.add({ /* ... error message ... */ });
      this.completionRequestedSubjects.delete(subjectId); // Must remove on error
    }
  });
}


// *** ADDED: Confirmation method ***
// Add console.log inside confirmRequestCompletion
confirmRequestCompletion(subjectId: number, subjectName: string) {
  // *** DEBUG: Log the received ID ***
  console.log('[confirmRequestCompletion] Received Subject ID:', subjectId, 'Name:', subjectName);

  if (this.completionRequestedSubjects.has(subjectId)) { return; }
      this.confirmationService.confirm({
        message: `Are you sure you want to request completion for subject "${subjectName}"?`,
        header: 'Confirm Request',
        icon: 'pi pi-question-circle',
        acceptLabel: 'Yes, Request',
        rejectLabel: 'No',
        accept: () => {
            this.requestCompletion(subjectId);
        },
      reject: () => {
        // Optional: Show toast or console message
        console.log("Changes not saved.");
      }
    });
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
 confirmSave() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to save the changes?',
      header: 'Confirm Save',
      icon: 'fas fa-exclamation-triangle',
      acceptLabel: 'Yes',
      rejectLabel: 'No',
      accept: () => {
        this.saveChanges();  // This is your existing save method
      },
      reject: () => {
        // Optional: Show toast or console message
        console.log("Changes not saved.");
      }
    });
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

  showDownloadDialog() {
    this.displayDownloadDialog = true;
  }
  downloadPDFReport() {
    const doc = new jsPDF();
  
    doc.text('Attendance Report for ', 14, 16);
    autoTable(doc, {
      startY: 20,
      head: [['Roll No', 'Name', 'Present / Total', 'Percentage %']],
      body: this.students.map(s => [
        s.roll_no,
        s.name,
        `${s.present} / ${s.total}`,
        `${s.percentage.toFixed(2)}%`
      ])
    });
  
    const filename = this.downloadFileName?.trim() || 'Attendance_Report';
    doc.save(`${filename}.pdf`);
    this.displayDownloadDialog = false;
  }
  applyFilters() {
    this.filteredStudents = this.students.filter(student => {
      const matchQuery = !this.searchQuery || 
        student.name.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
        student.roll_no.toLowerCase().includes(this.searchQuery.toLowerCase());
  
      const matchPercentage = this.minPercentage == null || 
        student.percentage >= this.minPercentage;
  
      return matchQuery && matchPercentage;
    });
  }
  getEventValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
  

  getstubjectStatus() {
    this.activeSubjects = [];
    this.completedSubjects = [];
  
    this.subject_status = this.subjectsList.map((subject: any) => {
      const status = subject.status || 'Unknown';
      const subjectName = subject.name || 'Unknown';
      const facultyName = subject.faculty?.user?.full_name || 'N/A';
  
      // Group active and completed subjects separately
      if (status === 'active' || status === 'completion_requested') {
        this.activeSubjects.push(subject);
      } else if (status === 'completed') {
        this.completedSubjects.push(subject);
      }
  
      return {
        subject: subjectName,
        faculty: facultyName,
        status: status,
      };
    });
  
    console.log('Subject Status:', this.subject_status);
    console.log('Completed Subjects:', this.completedSubjects);
  }

  
  markSubjectAsCompleted(subjectId: number): void {
    if (!subjectId || this.completionRequestedSubjects.has(subjectId)) return;
    console.log(`Requesting completion for subject ID: ${subjectId}`);
    this.completionRequestedSubjects.add(subjectId);
    const headers = new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('access_token')}`);
    this.teacherDashboardService.requestSubjectCompletion(subjectId, headers).subscribe(
      (response) => {
        console.log('Subject completion requested:', response);
        this.messageService.add({
          key: 'main-toast',
          severity: 'success',
          summary: 'Request Sent',
          detail: 'Subject completion request sent successfully!',
          life: 3000
        });
        const subjectIndex = this.activeSubjects.findIndex(subject => subject.id === subjectId);
        if (subjectIndex !== -1) {
          this.activeSubjects[subjectIndex].status = 'completed'; // Update status
          this.completedSubjects.push(this.activeSubjects[subjectIndex]); // Move to completed subjects
          this.activeSubjects.splice(subjectIndex, 1); // Remove from active subjects
        }
        this.completionRequestedSubjects.delete(subjectId);
      },
      (error) => {
        console.error('Failed to request subject completion:', error);
        this.messageService.add({
          key: 'main-toast',
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to send subject completion request.',
          life: 3000
        });
        this.completionRequestedSubjects.delete(subjectId);
      }
    );
  }
  handleMarkAsCompleted(subjectId: number): void {
    console.log(`Button clicked for subject ID: ${subjectId}`);
    this.markSubjectAsCompleted(subjectId);
  }

  

  
 
}
 