import { Component } from '@angular/core';

@Component({
  selector: 'app-student-attendance',
  templateUrl: './student-attendance.component.html',
  styleUrls: ['./student-attendance.component.css']
})
export class StudentAttendanceComponent {
  activeAttendanceSession: any = { subject: "CNS", faculty: "Dr. Smith" }; // Dummy Data

  markAttendance() {
    alert("Marking attendance with GPS & Facial Recognition...");
    // Implement actual attendance marking logic here
  }
}
