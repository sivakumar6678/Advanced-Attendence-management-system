import { Component, OnInit, Input } from '@angular/core';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-student-attendance',
  templateUrl: './student-attendance.component.html',
  styleUrls: ['./student-attendance.component.css']
})
export class StudentAttendanceComponent implements OnInit {
  @Input() studentId!: string; // ✅ Receive student ID as string
  studentProfile: any;
  activeSessions: { start_time: string; session_duration: number; periods?: any[] }[] = [];

  constructor(private userService: UserService) {}

  ngOnInit() {
    console.log('✅ Received Student ID:', this.studentId);
    
    if (this.studentId) {
      this.fetchActiveAttendanceSessions();
    } else {
      console.error("❌ Student ID is undefined or null");
    }
    this.fetchActiveAttendanceSessions();
    setInterval(() => {
      this.fetchActiveAttendanceSessions();
    }, 30000);
  }

  fetchActiveAttendanceSessions() {
    this.userService.getActiveAttendanceSessions(this.studentId).subscribe(
        (sessions) => {
            console.log("✅ Active Attendance Sessions from Backend:", sessions);
            
            if (sessions && sessions.length > 0) {
                this.activeSessions = sessions.map((session: { start_time: string; session_duration: number; periods?: any[] }) => ({
                    ...session,
                    periods: Array.isArray(session.periods) ? session.periods : [] // ✅ Ensure periods is an array
                }));
            } else {
                this.activeSessions = [];  // ✅ No active sessions
            }
        },
        (error) => {
            console.error("❌ Error fetching active attendance sessions:", error);
            this.activeSessions = []; // ✅ Handle errors properly
        }
    );
}




markAttendance(sessionId: number) {
  navigator.geolocation.getCurrentPosition(
      (position) => {
          const attendanceData = {
              student_id: this.studentId, 
              session_id: sessionId,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
          };

          this.userService.markAttendance(attendanceData).subscribe(
              (response) => {
                  console.log("✅ Attendance marked successfully!", response);
                  this.fetchActiveAttendanceSessions(); // ✅ Refresh sessions
                  alert(`🎉 Attendance marked for ${attendanceData.session_id}!`);
              },
              (error) => {
                  console.error("❌ Error marking attendance:", error);
                  alert("⚠️ Unable to mark attendance.");
              }
          );
      },
      (error) => {
          console.error("❌ Error fetching location:", error);
          alert("⚠️ Location access is required to mark attendance.");
      }
  );
}

}
  
