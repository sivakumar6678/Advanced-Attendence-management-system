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

  sessionTimer: number = 0;  // ⬅️ Stores countdown time
  timerInterval: any = null;  // ⬅️ Holds interval reference

  isSessionActive: boolean = false;  // ✅ Controls UI toggle

  totalStudents: number = 70;  // ✅ Example total students
  presentStudents: number = 0; // ✅ Updated in real-time

  sessionId: number | null = null; // ✅ Store session ID for updates
  attendanceCheckInterval: any = null; // ✅ Track real-time attendance updates

  private attendanceFetchInterval: any = null;  // ✅ Store interval reference


  
  constructor(private userService: UserService) {}

  ngOnInit() {
    if (this.selectedSubject) {
      this.Subject_name = this.selectedSubject.subject_name;
      this.branch = this.selectedSubject.branch;
      this.year = this.selectedSubject.year;
      this.sem = this.selectedSubject.semester;
      this.resetTimer();
    }
    this.processTimetableEntries();
    this.fetchTimetableConfig();
    this.checkForActiveSession(); // ✅ Check if there’s an unfinished session
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
    console.log("🚀 Processing timetable for subject:", this.selectedSubject?.subject_name);

    if (!this.subjectTimetable || this.subjectTimetable.length === 0) {
        console.warn("⚠️ No timetable found, switching to manual mode.");
        this.selectionMode = 'manual';
        return;
    }

    const today = new Date();
    const dayIndex = today.getDay(); // Get the day index (0-6)
    const dayName = this.days[dayIndex === 0 ? 6 : dayIndex - 1].trim(); // Adjust for Sunday

    // console.log("🔍 Searching for subject:", this.selectedSubject.subject_id, 
    //             "Faculty:", this.facultyId, "Day:", dayName);

    // console.log("📌 All timetable entries:", this.subjectTimetable);

    // Check if 'day' matches and trim spaces
    const subjectEntries = this.subjectTimetable.filter(entry => {
        console.log(`🔎 Checking Entry -> Subject: ${entry.subject_id}, Faculty: ${entry.faculty_id}, Day: ${entry.day.trim()}`);
        
        return entry.day.trim() === dayName && 
               Number(entry.subject_id) === Number(this.selectedSubject.subject_id) &&
               Number(entry.faculty_id) === Number(this.facultyId);
    });

    // console.log("📅 Today's Timetable Entries:", subjectEntries);

    if (subjectEntries.length > 0) {
        const sortedEntries = subjectEntries.sort((a, b) => {
            const timeA = new Date(`1970/01/01 ${a.time_slot.split(' - ')[0]}`).getHours();
            const timeB = new Date(`1970/01/01 ${b.time_slot.split(' - ')[0]}`).getHours();
            return timeA - timeB;
        });

        const selectedEntry = sortedEntries[0];

        this.autoSelectedDay = selectedEntry.day;
        this.autoSelectedPeriod = selectedEntry.time_slot;
        this.autoSelectedTiming = selectedEntry.time_slot;

        console.log("✅ Auto-selected period for", this.selectedSubject.subject_name, ":", this.autoSelectedPeriod);
    } else {
        console.warn("⚠️ No periods found for the selected subject today, switching to manual mode.");
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
    this.sessionTimer = this.sessionDuration * 60; // ⬅️ Convert minutes to seconds
    this.startTimer(); // ⬅️ Start the countdown

    // ✅ Stop any existing attendance fetching before starting a new one
    if (this.attendanceFetchInterval) {
      clearInterval(this.attendanceFetchInterval);
    }

    // ✅ Start real-time attendance fetching
    this.attendanceFetchInterval = setInterval(() => {
      this.fetchRealTimeAttendance(); 
    }, 30000);  // Fetch every 30 seconds

    // ✅ Check mode and set session details accordingly
    let finalDay = this.selectionMode === 'auto' ? this.autoSelectedDay : this.selectedDay;
    let finalPeriods = this.selectionMode === 'auto' 
        ? [{ time_slot: this.autoSelectedPeriod }] 
        : this.selectedPeriods.map(period => ({ time_slot: period }));

    if (!finalDay || finalPeriods.length === 0 || finalPeriods.some(p => !p.time_slot)) {
        console.error('❌ Cannot start session: No day or period selected.');
        alert("⚠️ Please select a day and at least one valid period to start the session.");
        return;
    }

    // ✅ Store session data to display in UI correctly
    this.autoSelectedDay = finalDay;
    this.autoSelectedPeriod = finalPeriods.map(p => p.time_slot).join(', '); // Store periods as a string for display
    this.isSessionActive = true;  // ✅ Mark session as active

    console.log("✅ Session Started - Mode:", this.selectionMode);
    console.log("📅 Day:", this.autoSelectedDay, "| Periods:", this.autoSelectedPeriod);
    

    // Check if GPS mode is selected
    if (this.selectedModes.includes("GPS")) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                  console.log("📍 Accuracy (meters):", position.coords.accuracy);
                    console.log("✅ Faculty GPS Location:", position.coords.latitude, position.coords.longitude);
                    this.sendSessionToBackend(finalDay, finalPeriods, position.coords.latitude, position.coords.longitude);
                },
                (error) => {
                    console.error("❌ GPS access denied or unavailable:", error);
                    alert("⚠️ GPS is required for location-based attendance. Please enable it.");
                },
                {
                  enableHighAccuracy: true, // 👈 This is the magic line
                  timeout: 10000,
                  maximumAge: 0,
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

    this.userService.startAttendanceSession(sessionData).subscribe(
      (response: { session_id?: number }) => {  // ✅ Define response type explicitly
          console.log("✅ Attendance session started successfully:", response);
          alert("🎉 Attendance session started!");

          if (response.session_id) {  // ✅ Ensure `session_id` exists before using
              this.sessionId = response.session_id; 
              this.fetchRealTimeAttendance();
          } else {
              console.error("❌ No session_id returned in response:", response);
              alert("⚠️ Error: Session ID missing from response!");
          }
          localStorage.setItem("activeSession", JSON.stringify({
            sessionId: this.sessionId,
            endTime: new Date().getTime() + this.sessionDuration * 60000
          }));
      },
      (error) => {
          console.error("❌ Error starting attendance session:", error);
          alert("⚠️ Failed to start session. Try again.");
      }
  );
  }
  checkForActiveSession() {
    const savedSession = localStorage.getItem("activeSession");

    if (savedSession) {
        const sessionData = JSON.parse(savedSession);
        const timeRemaining = sessionData.endTime - new Date().getTime();

        if (timeRemaining > 0) {
            // ✅ Restore session from localStorage
            this.sessionId = sessionData.sessionId;
            this.isSessionActive = true;
            this.sessionTimer = Math.floor(timeRemaining / 1000);
            this.startTimer();
            console.log("⏳ Resuming session from localStorage:", this.sessionId);
            
            // ✅ Stop any existing attendance fetching before starting a new one
            if (this.attendanceFetchInterval) {
                clearInterval(this.attendanceFetchInterval);
            }

            // ✅ Start real-time attendance fetching after restoring session
            this.fetchRealTimeAttendance();
            return;
        } else {
            console.warn("⚠️ Expired session found in localStorage. Ending it.");
            this.endSession();
            localStorage.removeItem("activeSession");
        }
    }

    // 🔥 If no session in localStorage, check backend
    this.userService.getActiveAttendanceSession(this.facultyId).subscribe(
        (session) => {
            if (session && session.is_active) {
                console.log("✅ Resuming session from backend:", session);
                this.sessionId = session.session_id;
                this.sessionTimer = Math.max(0, (new Date(session.end_time).getTime() - Date.now()) / 1000);
                this.isSessionActive = true;
                this.startTimer();

                // ✅ Save session in localStorage
                localStorage.setItem("activeSession", JSON.stringify({
                    sessionId: session.session_id,
                    endTime: new Date(session.end_time).getTime()
                }));

                // ✅ Stop any existing attendance fetching before starting a new one
                if (this.attendanceFetchInterval) {
                    clearInterval(this.attendanceFetchInterval);
                }

                // ✅ Resume real-time attendance fetching
                this.fetchRealTimeAttendance();
            }
        },
        (error) => {
            console.error("❌ No active session found in backend:", error);
        }
    );
}


startTimer() {
  if (this.timerInterval) {
    clearInterval(this.timerInterval);
  }
  
  this.timerInterval = setInterval(() => {
    if (this.sessionTimer > 0) {
      this.sessionTimer--;
    } else {
      clearInterval(this.timerInterval);
      this.isSessionActive = false;  // ✅ End session when timer runs out
      alert("⏳ Session Expired!");
      this.sessionTimer = 0; 
    }
  }, 1000);
}
fetchRealTimeAttendance() {
  if (!this.sessionId) return;

  // ✅ Clear existing intervals to avoid duplicate calls
  if (this.attendanceFetchInterval) {
    clearInterval(this.attendanceFetchInterval);
  }

  this.attendanceFetchInterval = setInterval(() => {
    if (this.sessionId !== null) {  // ✅ Ensure sessionId is not null before calling API
        this.userService.getAttendanceCount(this.sessionId as number).subscribe(
            (response) => {
                this.presentStudents = response.present_count;
                console.log("👥 Updated Attendance Count:", this.presentStudents);
            },
            (error) => {
                console.error("❌ Error fetching attendance count:", error);
            }
        );
    } else {
        console.warn("⚠️ Skipping attendance check: sessionId is null.");
    }
  }, 30000); // ✅ Updates every 30 seconds
}

resetTimer() {
  if (this.timerInterval) {
    clearInterval(this.timerInterval);
  }
  this.sessionTimer = 0;
}
endSession() {
  if (!this.sessionId) return;
  clearInterval(this.timerInterval);
  this.isSessionActive = false;
  this.sessionTimer = 0;
  console.log("session id ", this.sessionId);
  this.userService.endAttendanceSession(this.sessionId).subscribe(
    (response) => {
      console.log("✅ Attendance session ended:", response);
      alert("✅ Session has ended!");

      // ✅ Reset UI & Clear Data
      this.sessionId = null;
      this.isSessionActive = false;
      this.sessionTimer = 0;
      this.selectedModes = ['GPS']; // Reset selection
      this.selectedPeriods = [];
      this.selectedDay = null;
      // ✅ Stop real-time attendance fetching
      if (this.attendanceFetchInterval) {
        clearInterval(this.attendanceFetchInterval);
        this.attendanceFetchInterval = null;
      }  
    },
    (error) => {
      console.error("❌ Error ending attendance session:", error);
      alert("⚠️ Failed to end session. Try again.");
    }
  );
}

 
getFormattedTime(sessionTimer: number): string {
  const minutes = Math.floor(sessionTimer / 60);
  const seconds = ('0' + (sessionTimer % 60)).slice(-2);
  return `${minutes}:${seconds}`;
}
getDisplayedPeriods(): string {
  if (this.selectionMode === 'auto') {
      return this.autoSelectedPeriod || 'N/A';
  } else {
      return this.selectedPeriods && this.selectedPeriods.length > 0 
          ? this.selectedPeriods.map(p => p.time_slot).join(', ') 
          : 'N/A';
  }
}

}
