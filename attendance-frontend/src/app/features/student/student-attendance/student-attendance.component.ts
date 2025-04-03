import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import * as faceapi from 'face-api.js';  // ✅ Load FRS Library

// ✅ Define session type
export interface AttendanceSession {
  session_id: number;
  subject_name: string;
  day: string;
  periods: string[];
  start_time: string;
  end_time: string;
  modes: string[];
  remainingTime?: string;
  marked?: boolean;
}

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
  selector: 'app-student-attendance',
  templateUrl: './student-attendance.component.html',
  styleUrls: ['./student-attendance.component.css']
})
export class StudentAttendanceComponent implements OnInit, OnDestroy {
  @Input() studentId!: string;
  
  activeSessions: AttendanceSession[] = [];
  capturingFace = false;
  modelLoaded = false;
  timers: { [key: number]: any } = {}; // ✅ Store timers for each session
  

  constructor(private userService: UserService) {}

  async ngOnInit() {
    console.log('✅ Received Student ID:', this.studentId);
    if (this.studentId) {
      this.fetchActiveAttendanceSessions();
    } else {
      console.error("❌ Student ID is undefined or null");
    }

    // ✅ Refresh session list every 50 seconds
    setInterval(() => {
      this.fetchActiveAttendanceSessions();
    }, 120000);

    await this.loadFaceRecognitionModels();  // ✅ Load models on initialization
  }

  ngOnDestroy() {
    Object.values(this.timers).forEach(clearInterval); // ✅ Clear all timers when component is destroyed
  }

  fetchActiveAttendanceSessions() {
    this.userService.getActiveAttendanceSessions(this.studentId).subscribe(
      (sessions: AttendanceSession[]) => {
        console.log("✅ Active Attendance Sessions:", sessions);
        
        if (sessions.length > 0) {
          this.activeSessions = sessions.map(session => ({
            ...session,
            periods: Array.isArray(session.periods) ? session.periods : [],
            marked: this.isAttendanceMarked(session.session_id)
          }));
  
          this.activeSessions.forEach(session => this.startTimer(session));
        } else {
          this.activeSessions = [];
        }
      },
      (error) => {
        console.error("❌ Error fetching active attendance sessions:", error);
      }
    );
  }
  

  startTimer(session: AttendanceSession) {
    if (!session.end_time) return; // ✅ Ensure end_time is available

    const sessionEndTime = new Date(session.end_time).getTime();

    this.timers[session.session_id] = setInterval(() => {
        const timeLeft = Math.max(0, sessionEndTime - Date.now());

        if (timeLeft <= 0) {
            clearInterval(this.timers[session.session_id]); // ✅ Stop timer when expired
            this.activeSessions = this.activeSessions.filter(s => s.session_id !== session.session_id);
            return;
        }

        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        
        session.remainingTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
  }

  isAttendanceMarked(sessionId: number): boolean {
    return localStorage.getItem(`attendance_${sessionId}`) === 'marked';
  }

  async loadFaceRecognitionModels() {
    try {
      await faceapi.nets.ssdMobilenetv1.loadFromUri('/assets/models');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/assets/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/assets/models');
      this.modelLoaded = true;
      console.log("✅ Face Recognition models loaded successfully!");
    } catch (error) {
      console.error("❌ Error loading Face Recognition models:", error);
    }
  }

  async markAttendance(session: AttendanceSession) {
    if (session.marked) {
      alert("✅ Attendance already marked!");
      return;
    }

    const requiresGPS = session.modes.includes("GPS");
    const requiresFRS = session.modes.includes("FRS");

    let faceData = null;
    let studentLocation: { latitude: number; longitude: number } | null = null;

    if (requiresFRS) {
      if (!this.modelLoaded) {
        alert("⚠️ Face Recognition models are not loaded yet. Please try again.");
        return;
      }

      this.capturingFace = true;
      faceData = await this.captureFace();
      this.capturingFace = false;

      if (!faceData) {
        alert("⚠️ Face not detected. Please try again.");
        return;
      }
    }

    if (requiresGPS) {
      studentLocation = await this.getStudentLocation();
      if (!studentLocation) {
        alert("⚠️ GPS is required for this session. Please enable location services.");
        return;
      }
    }

    this.sendAttendanceRequest(session, faceData, studentLocation);
  }

  sendAttendanceRequest(session: AttendanceSession, faceData: any | null, studentLocation: any | null) {
    // ✅ Convert period time to period number
    const period = session.periods.length > 0 ? this.getPeriodNumber(session.periods[0]) : "Unknown Period";

    const attendanceData: any = {
      student_id: this.studentId,
      session_id: session.session_id,
      period: period, // ✅ Now sends period number
      ...(faceData && { face_descriptor: faceData }), 
      ...(studentLocation && { 
        latitude: studentLocation.latitude, 
        longitude: studentLocation.longitude 
      })
    };

    this.userService.markAttendance(attendanceData).subscribe(
      (response) => {
        console.log("✅ Attendance marked successfully!", response);
        alert("🎉 Attendance marked successfully!");

        session.marked = true; 
        localStorage.setItem(`attendance_${session.session_id}`, 'marked'); 
      },
      (error) => {
        console.error("❌ Error marking attendance:", error);
        alert("⚠️ Failed to mark attendance. Try again.");
      }
    );
  }

  getPeriodNumber(periodTime: string): number | string {
    return periodMapping[periodTime] || periodTime;
  }

  async captureFace() {
    const video = document.createElement("video");
    video.setAttribute("autoplay", "true");

    const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
    video.srcObject = stream;

    return new Promise((resolve) => {
      setTimeout(async () => {
        const detections = await faceapi.detectSingleFace(video).withFaceLandmarks().withFaceDescriptor();
        stream.getTracks().forEach(track => track.stop()); 
        resolve(detections?.descriptor || null);
      }, 2000);
    });
  }

  async getStudentLocation(): Promise<{ latitude: number; longitude: number } | null> {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        },
        (error) => {
          console.error("❌ GPS Error:", error);
          resolve(null);
        }
      );
    });
  }
}
