import { Component, OnInit, Input ,OnChanges, SimpleChanges } from '@angular/core';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-teacher-attendance',
  templateUrl: './teacher-attendance.component.html',
  styleUrls: ['./teacher-attendance.component.css']
})
export class TeacherAttendanceComponent implements OnInit {
  @Input() selectedSubject: any;
  @Input() subjectTimetable: any[] = [];
  @Input()
  facultyId!: number;  // ✅ Receive Faculty ID

  Subject_name: string | null = null;
  branch: string | null = null;
  year: number | null = null;
  sem: number | null = null;

  timeSlots: any[] = [];

  days: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  selectionMode: string = 'auto';
  sessionDuration: number = 10;
  selectedModes: string[] = ['GPS'];
  availablePeriods: any[] = [];
  selectedPeriods: any[] = [];
  selectedDay: string | null = null;
  autoSelectedDay: string | null = null;
  autoSelectedPeriod: string | null = null;
  autoSelectedTiming: string | null = null;

  constructor(private userService: UserService) {}

  ngOnInit() {
    if (this.selectedSubject) {
      this.Subject_name = this.selectedSubject.subject_name;
      this.branch = this.selectedSubject.branch;
      this.year = this.selectedSubject.year;
      this.sem = this.selectedSubject.semester;
    }
    this.processTimetableEntries();
    this.fetchTimetableConfig();
  }
  // ✅ Detect changes when subjectTimetable is updated
  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedSubject']) {
      console.log("🔄 Subject changed. Resetting data...");
      
      // ✅ Reset auto-selected data when subject changes
      this.autoSelectedDay = null;
      this.autoSelectedPeriod = null;
      this.autoSelectedTiming = null;
      this.selectionMode = 'auto';

      if (this.selectedSubject) {
        this.Subject_name = this.selectedSubject.subject_name;
        this.branch = this.selectedSubject.branch;
        this.year = this.selectedSubject.year;
        this.sem = this.selectedSubject.semester;
      }
    }
    if (changes['subjectTimetable'] && this.subjectTimetable.length > 0) {
      console.log("🔄 Timetable received:", this.subjectTimetable);
      this.processTimetableEntries();
    }
  }
  fetchTimetableConfig() {
    this.userService.getTimetableConfig().subscribe(
      (data) => {
        console.log('📌 Timetable Config:', data);
        if (data.time_slots) {
          this.timeSlots = data.time_slots.map((time: string, index: number) => ({
            label: `Period ${index + 1} - ${time}`,
            value: time
          }));
        }
      },
      (error) => console.error('❌ Error fetching timetable config:', error)
    );
  }

  processTimetableEntries() {
    console.log("🚀 Processing timetable...");

    if (this.subjectTimetable?.length > 0) {
      const today = new Date();
      const dayName = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][today.getDay() - 1];

      const todaysEntries = this.subjectTimetable.filter(entry => entry.day === dayName);

      if (todaysEntries.length > 0) {
        const currentHour = today.getHours();

        const matchingEntry = todaysEntries.find(entry => {
          const periodTime = entry.time_slot.split(' - ')[0];
          const periodHour = new Date(`1970/01/01 ${periodTime}`).getHours();
          return periodHour >= currentHour;
        });

        const selectedEntry = matchingEntry || todaysEntries[0];

        this.autoSelectedDay = selectedEntry.day;
        this.autoSelectedPeriod = selectedEntry.time_slot;
        this.autoSelectedTiming = selectedEntry.time_slot;

        console.log("✅ Auto-selected period:", this.autoSelectedPeriod);
      } else {
        console.warn("⚠️ No periods found for today, switching to manual mode.");
        this.selectionMode = 'manual';
      }
    } else {
      console.warn("⚠️ No timetable found at all, switching to manual mode.");
      this.selectionMode = 'manual';
    }
  }
  

  handleModeChange() {
    if (this.selectionMode === 'auto') {
      this.processTimetableEntries();
    } else {
      this.selectedDay = null;
      this.selectedPeriods = [];
    }
  }

  startAttendanceSession() {
    // Determine the final day and periods based on the selection mode
    let finalDay = this.selectionMode === 'auto' ? this.autoSelectedDay : this.selectedDay;
    let finalPeriods = this.selectionMode === 'auto' 
        ? [{ time_slot: this.autoSelectedPeriod }] 
        : this.selectedPeriods.map(period => ({ time_slot: period }));

    // Validate that both day and periods are selected
    if (!finalDay || finalPeriods.length === 0 || finalPeriods.some(p => !p.time_slot)) {
        console.error('❌ Cannot start session: No day or period selected.');
        alert("⚠️ Please select a day and at least one valid period to start the session.");
        return;
    }

    // Check if GPS mode is selected
    if (this.selectedModes.includes("GPS")) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    console.log("✅ Faculty GPS Location:", position.coords.latitude, position.coords.longitude);
                    this.sendSessionToBackend(finalDay, finalPeriods, position.coords.latitude, position.coords.longitude);
                },
                (error) => {
                    console.error("❌ GPS access denied or unavailable:", error);
                    alert("⚠️ GPS is required for location-based attendance. Please enable it.");
                }
            );
        } else {
            console.error("❌ Geolocation is not supported in this browser.");
            alert("⚠️ Geolocation is not supported in this browser.");
        }
    } else {
        // If GPS is not selected, send session without location
        this.sendSessionToBackend(finalDay, finalPeriods);
    }
}

// 🔥 Function to Send Data to Backend
sendSessionToBackend(finalDay: string, finalPeriods: any[], latitude?: number, longitude?: number) {
    const sessionData = {
        faculty_id: this.facultyId,  // ✅ Include faculty_id when sending data
        subject_id: this.selectedSubject.subject_id,
        branch: this.selectedSubject.branch,
        year: this.selectedSubject.year,
        semester: this.selectedSubject.semester,
        modes: this.selectedModes,  
        session_duration: this.sessionDuration,
        start_time: new Date().toISOString(),
        day: finalDay,
        periods: finalPeriods.map(p => p.time_slot),
        ...(this.selectedModes.includes("GPS") && { latitude, longitude }) // 🔥 Include GPS data only if selected
    };

    console.log("📤 Sending Session Data:", sessionData);

    // 🔥 API Call to Backend
    this.userService.startAttendanceSession(sessionData).subscribe(
        (response) => {
            console.log("✅ Attendance session started successfully:", response);
            alert("🎉 Attendance session started!");
        },
        (error) => {
            console.error("❌ Error starting attendance session:", error);
            alert("⚠️ Failed to start session. Try again.");
        }
    );
}
}
