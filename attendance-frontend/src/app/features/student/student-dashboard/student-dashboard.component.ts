import { Component, OnInit, AfterViewInit, ViewChild, ElementRef,ChangeDetectorRef } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { Router } from '@angular/router';
import { HttpHeaders } from '@angular/common/http';
import { MessageService } from 'primeng/api'; // Assuming you're using PrimeNG for notifications
import { AttendanceSession } from '../student-attendance/student-attendance.component';
import { Chart, registerables } from 'chart.js';
// ✅ Mapping time slots to period numbers
const periodMapping: { [key: string]: number } = {
  "9:15 AM - 10:15 AM": 1,
  "10:15 AM - 11:15 AM": 2,
  "11:30 AM - 12:30 PM": 3,
  "1:30 PM - 2:30 PM": 4,
  "2:30 PM - 3:30 PM": 5,
  "3:30 PM - 4:30 PM": 6
};
@Component({
  selector: 'app-student-dashboard',
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.css']
})
export class StudentDashboardComponent implements OnInit,AfterViewInit {

  @ViewChild('barCanvas') barCanvas!: ElementRef;
  @ViewChild('pieCanvas') pieCanvas!: ElementRef;

  @ViewChild('barChartCanvas') barChartCanvas!: ElementRef;
  @ViewChild('pieChartCanvas') pieChartCanvas!: ElementRef;


  studentProfile: any;
  attendanceStatus = "Present";
  attendancePercentage = 5;
  publicTimetable: any[] = [];
  activeSection: string = 'dashboard'; // Default section

  activeAttendanceSession: any = null; // Dummy data for attendance session
  
  year: number | null = null;
  semester: number | null = null;
  academicYear: string | null = null;
  branch: string | null = null;

  attendanceRecords: any[] = [];
  subjects: any[] = [];

  selectedDay: string = 'all';
  filteredTimetable: any[] = [];
  daysOfWeek: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  attendanceTableData: any[] = []; // New property for the table data
  uniqueSubjects: string[] = []; // New property for unique subjects
  uniquePeriods: number[] = [];
  
  sessionRemainingTime: string = "N/A";
  attendanceStreak: number = 0;
  
  isAttendanceSessionActive = false;
  isOnline: boolean = navigator.onLine; // ✅ Check if the user is online
  
  chart!: Chart;
  chartsReady: boolean = false;


  barChart: any;
  pieChart: any;

  
  constructor(
    private userService: UserService,
    private router: Router,
    private messageService: MessageService ,
    private cdRef: ChangeDetectorRef // ✅ Add this
  ) {}

  ngOnInit(): void {
    this.fetchStudentProfile();
    
    this.calculateStreak();
    setInterval(() => this.updateCountdown(), 1000);

    this.checkOnlineStatus();
    
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.fetchActiveAttendanceSession();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.activeAttendanceSession = null;
    });

    Chart.register(...registerables);

}

ngAfterViewInit(): void {
  if (this.activeSection === 'dashboard') {
    setTimeout(() => {
      this.prepareChartData();
    }, 100); // small delay to ensure canvas is in DOM
  }
  const isMobile = window.innerWidth < 768;
  if (!isMobile) {
    alert("This module is available only on mobile devices.");
    this.router.navigate(['/home']);
  }
}




  checkOnlineStatus(): void {
    this.isOnline = navigator.onLine;
    console.log('Online status checked:', this.isOnline);
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

        this.fetchAttendance();

        // ✅ Call loadPublicTimetable() only after student data is set
        if (this.year && this.semester && this.academicYear && this.branch) {
          this.loadPublicTimetable();

          if(this.isOnline){
            this.fetchActiveAttendanceSession();
          }
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
            this.filteredTimetable = [...this.publicTimetable]; // Initialize filtered timetable
          } else {
            console.warn("No timetable found for the given details.");
            this.publicTimetable = [];  // ✅ Ensure array is empty if no data
            this.filteredTimetable = [];
          }
        },
        (error) => {
          console.error("Error fetching public timetable:", error);
        }
      );
  }


  setActiveSection(section: string): void {
    this.activeSection = section;
  
    if (section === 'dashboard') {
      setTimeout(() => {
        this.prepareChartData();
      }, 100);
    }
  }
  
  getSubjectName(subjectId: number | null): string {
    if (!subjectId) return 'Unknown';
    return `Subject ${subjectId}`;  // Replace this with a real lookup if needed
  }

  getFacultyName(facultyId: number | null): string {
    if (!facultyId) return 'Unknown';
    return `Faculty ${facultyId}`;  // Replace this with a real lookup if needed
  }

  filterTimetableByDay(): void {
    if (this.selectedDay === 'all') {
      this.filteredTimetable = [...this.publicTimetable];
    } else {
      this.filteredTimetable = this.publicTimetable.filter(entry => 
        entry.day.toLowerCase() === this.selectedDay.toLowerCase()
      );
    }
  }



  logout(){
    this.messageService.add({
      key:'main-toast',
      severity: 'success',
      summary: 'Logout Successful',
      detail: 'You have been logged out successfully.',
      life: 3000
    });
    setTimeout(() => {
    localStorage.removeItem('access_token');
    this.router.navigate(['/student-auth']);
    }, 3000);
  }
  fetchAttendance(): void {
    if (!this.studentProfile || !this.studentProfile.student_id) {
      console.error('Student profile not loaded. Cannot fetch attendance.');
      return;
    }

    const studentId = this.studentProfile.student_id;
    this.userService.getAttendanceDetails(studentId).subscribe(
      data => {
        this.attendanceRecords = data;
        console.log('Attendance Records:', this.attendanceRecords);
        this.formatAttendanceData();

        this.calculateOverallAttendance(); // 🔥 Calculate attendance percentage
        this.calculateStreak(); // 🔥 Calculate attendance streak

        this.prepareChartData();
      },
      error => {
        console.error('Error fetching attendance:', error);
      }
    );
}

getPeriodNumber(periodAttendance: string): number | string {
  const timeRange = periodAttendance.match(/\d{1,2}:\d{2} [APM]+ - \d{1,2}:\d{2} [APM]+/g);
  return timeRange ? periodMapping[timeRange[0]] || "?" : "?"; // 🔥 Default to "?" if not found
}

// ✅ Extract attendance status (P or A)
getAttendanceStatus(periodAttendance: string): string {
  return periodAttendance.includes("P") ? "P" : "A";
}

formatAttendanceData(): void {
  const attendanceByDate: { [date: string]: { [subject: string]: { [period: number]: string } } } = {};
  const subjectsSet = new Set<string>();
  const periodsSet = new Set<number>();

  this.attendanceRecords.forEach(record => {
      const date = new Date(record.timestamp).toLocaleDateString();
      const subject = record.subject_name;
      const period = record.period;
      const status = record.status;

      subjectsSet.add(subject);
      periodsSet.add(period);

      if (!attendanceByDate[date]) {
          attendanceByDate[date] = {};
      }
      if (!attendanceByDate[date][subject]) {
          attendanceByDate[date][subject] = {};
      }

      attendanceByDate[date][subject][period] = status;
  });

  this.uniqueSubjects = Array.from(subjectsSet).sort();
  this.uniquePeriods = Array.from(periodsSet).sort((a, b) => a - b);

  this.attendanceTableData = Object.keys(attendanceByDate)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()) // Sort dates in descending order
      .map(date => {
          const rowData: any = { date };
          this.uniqueSubjects.forEach(subject => {
              if (attendanceByDate[date][subject]) {
                  const periodAttendance = Object.entries(attendanceByDate[date][subject])
                      .map(([period, status]) => `(${period}°) = ${status === 'Present' ? 'P' : 'A'}`)
                      .join('  |  ');

                  rowData[subject] = periodAttendance || '-';
              } else {
                  rowData[subject] = '-';
              }
          });
          return rowData;
      });

  console.log('Formatted Attendance Data:', this.attendanceTableData);
}

updateCountdown() {
  if (this.activeAttendanceSession?.end_time) {
      const sessionEndTime = new Date(this.activeAttendanceSession.end_time).getTime();
      const timeLeft = Math.max(0, sessionEndTime - Date.now());

      if (timeLeft <= 0) {
          this.sessionRemainingTime = "00:00";
      } else {
          const minutes = Math.floor(timeLeft / 60000);
          const seconds = Math.floor((timeLeft % 60000) / 1000);
          this.sessionRemainingTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
  }
}

fetchActiveAttendanceSession() {
  if (!this.studentProfile?.student_id) {
    console.warn("⚠️ Student profile not loaded yet.");
    return;
  }

  this.userService.getActiveAttendanceSessions(this.studentProfile.student_id).subscribe(
    (sessions: AttendanceSession[]) => {
      if (sessions.length > 0) {
        this.activeAttendanceSession = sessions[0]; // ✅ Assign first active session
        this.isAttendanceSessionActive = true;
      } else {
        this.activeAttendanceSession = null;
        this.isAttendanceSessionActive = false;
      }
    },
    (error) => {
      console.error("❌ Error fetching active attendance session:", error);
      this.activeAttendanceSession = null;
      this.isAttendanceSessionActive = false;
    }
  );
}

calculateOverallAttendance(): void {
  if (!this.attendanceRecords || this.attendanceRecords.length === 0) {
      this.attendancePercentage = 0;
      return;
  }

  const totalClasses = this.attendanceRecords.length;
  const presentClasses = this.attendanceRecords.filter(record => record.status === 'Present').length;

  this.attendancePercentage = parseFloat(((presentClasses / totalClasses) * 100).toFixed(2));
}

calculateStreak(): void {
  let streak = 0;
  let previousDate = new Date();
  
  this.attendanceRecords.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  for (const record of this.attendanceRecords) {
    const recordDate = new Date(record.timestamp);
    if (record.status === "Present") {
      if (streak === 0 || (previousDate.getDate() - recordDate.getDate() === 1)) {
        streak++;
        previousDate = recordDate;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  this.attendanceStreak = streak;

  // 👇 Check if streak is broken
  this.checkStreakLoss(streak);
}
checkStreakLoss(streak: number): void {
  const today = new Date();
  const lastRecordDate = new Date(this.attendanceRecords[0]?.timestamp);
  const diffDays = Math.floor(
    (today.getTime() - lastRecordDate.getTime()) / (1000 * 3600 * 24)
  );

  // 😢 If streak is 0 and missed attendance in last 1-2 days
  if (streak === 0 && diffDays <= 2) {
    if (!localStorage.getItem('streak-notified')) {
      this.sendStreakLossNotification(); // 🔥 Trigger backend API
      localStorage.setItem('streak-notified', 'true'); // 🔐 Avoid spam
    }
  } else {
    localStorage.removeItem('streak-notified'); // 🔄 Reset if streak continues
  }
}
sendStreakLossNotification(): void {
  const studentId = this.studentProfile?.student_id;
  if (!studentId) return;

  this.userService.notifyStreakLoss(studentId).subscribe({
    next: () => console.log("📩 Streak loss email triggered."),
    error: (err) => console.error("❌ Error sending streak loss notification", err),
  });
}
checkStreakLossAtEvening(): void {
  const now = new Date();
  const currentHour = now.getHours();
  if (currentHour >= 17 && !localStorage.getItem('streakChecked')) {
    this.checkStreakLoss(this.attendanceStreak);
    localStorage.setItem('streakChecked', new Date().toDateString()); // optional
  }
}




prepareChartData(): void {
  const subjectAttendance: { [subject: string]: { present: number, total: number } } = {};

  this.attendanceRecords.forEach(record => {
    const subject = record.subject_name;
    if (!subjectAttendance[subject]) {
      subjectAttendance[subject] = { present: 0, total: 0 };
    }
    subjectAttendance[subject].total += 1;
    if (record.status === 'Present') {
      subjectAttendance[subject].present += 1;
    }
  });

  const subjects = Object.keys(subjectAttendance);
  const attendancePercentages = subjects.map(subject => 
    (subjectAttendance[subject].present / subjectAttendance[subject].total) * 100
  );

  const totalClasses = Object.values(subjectAttendance).reduce((sum, sub) => sum + sub.total, 0);
  const totalPresent = Object.values(subjectAttendance).reduce((sum, sub) => sum + sub.present, 0);
  const overallPercentage = (totalPresent / totalClasses) * 100;
  this.chartsReady = true;

  this.updateCharts(subjects, attendancePercentages, overallPercentage);
}


updateCharts(subjects: string[], attendanceData: number[], overallPercentage: number): void {
  const barCtx = this.barChartCanvas?.nativeElement?.getContext('2d');
  const pieCtx = this.pieChartCanvas?.nativeElement?.getContext('2d');

  

  if (this.barChart) this.barChart.destroy();
  if (this.pieChart) this.pieChart.destroy();
  
  const presentColors = attendanceData.map(percent => percent >= 40 ? 'green' : 'yellow');
  const absentColor = 'red';

  // Bar chart
  this.barChart = new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: subjects,
      datasets: [
        {
          label: 'Present (%)',
          data: attendanceData,
          backgroundColor: presentColors
        },
        {
          label: 'Absent (%)',
          data: subjects.map((_, i) => 100 - attendanceData[i]),
          backgroundColor: absentColor
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true
        }
      },
      scales: {
        x: { stacked: true },
        y: {
          stacked: true,
          beginAtZero: true,
          max: 100
        }
      }
    }
  });

  // Pie chart
  const overallColor = overallPercentage >= 75 ? '#36A2EB' : 'yellow';

  this.pieChart = new Chart(pieCtx, {
    type: 'pie',
    data: {
      labels: ['Present', 'Absent'],
      datasets: [{
        data: [overallPercentage, 100 - overallPercentage],
        backgroundColor: [overallColor, '#FF6384']
      }]
    },
    options: {
      responsive: true
    }
  });
}

getAttendanceBadge(percentage: number): { label: string; color: string; emoji: string } {
  if (percentage >= 90) {
    return { label: 'Gold Badge', color: 'gold', emoji: '🥇' };
  } else if (percentage >= 80) {
    return { label: 'Silver Badge', color: 'silver', emoji: '🥈' };
  } else if (percentage >= 70) {
    return { label: 'Bronze Badge', color: '#cd7f32', emoji: '🥉' }; // Bronze color
  } else {
    return { label: 'No Badge', color: '#ccc', emoji: '❌' };
  }
}



}
