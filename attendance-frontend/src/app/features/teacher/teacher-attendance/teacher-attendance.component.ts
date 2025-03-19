import { Component, OnInit, Input } from '@angular/core';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-teacher-attendance',
  templateUrl: './teacher-attendance.component.html',
  styleUrls: ['./teacher-attendance.component.css']
})
export class TeacherAttendanceComponent implements OnInit {
  @Input() selectedSubject: any; // ✅ Receive selected subject

  Subject_name: string | null = null;
  branch: string | null = null;
  year: number | null = null;
  sem: number | null = null;

  sessionDuration: number = 10;   // ✅ Default 10 mins
  numberOfPeriods: number = 1;    
  selectedPeriod: any = null;     // ✅ Selected period
  selectedModes: string[] = ['GPS']; // ✅ Default: GPS enabled

  periodOptions = [1, 2, 3, 4, 5, 6]; // ✅ Number of periods selection
  periodTimings: any[] = [];          // ✅ Period timing list (from API)

  constructor(private userService: UserService) {}

  ngOnInit() {
    if (this.selectedSubject) {
      this.Subject_name = this.selectedSubject.subject_name;
      this.branch = this.selectedSubject.branch;
      this.year = this.selectedSubject.year;
      this.sem = this.selectedSubject.semester;
    }
    this.fetchTimetableConfig();
  }

  fetchTimetableConfig() {
    this.userService.getTimetableConfig().subscribe(
      (data) => {
        console.log('Timetable config:', data);
        if (data.time_slots) {
          this.periodTimings = data.time_slots.map((time: string, index: number) => ({
            label: `Period ${index + 1} - ${time}`,
            value: time
          }));
        }
      },
      (error) => console.error('Error fetching period timings:', error)
    );
  }

  startAttendanceSession() {
    console.log(`📌 Starting session for: ${this.selectedSubject.subject_name}`);
    console.log(`📌 Period: ${this.selectedPeriod}, Number of Periods: ${this.numberOfPeriods}`);
    console.log(`📌 Duration: ${this.sessionDuration} mins`);
    console.log(`📌 Modes: ${this.selectedModes.join(', ')}`);
  }
}
