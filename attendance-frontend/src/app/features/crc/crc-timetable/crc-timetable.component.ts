import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../core/services/user.service';

interface TimetableSlot {
  time: string;
}

interface TimetableEntry {
  subject_id: number | null;
  faculty_id: number | null;
}

@Component({
  selector: 'app-crc-timetable',
  templateUrl: './crc-timetable.component.html',
  styleUrls: ['./crc-timetable.component.css']
})
export class CrcTimetableComponent implements OnInit {
  days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  timeSlots: TimetableSlot[] = [
    { time: '9:15 AM - 10:15 AM' },
    { time: '10:15 AM - 11:15 AM' },
    { time: '11:30 AM - 12:30 PM' },
    { time: '1:30 PM - 2:30 PM' },
    { time: '2:30 PM - 3:30 PM' },
    { time: '3:30 PM - 4:30 PM' }
  ];

  subjects: any[] = [];
  facultyList: any[] = [];
  timetable: { [day: string]: TimetableEntry[] } = {};
  semesterFinalized: boolean = false;
  showSaveToBackendButton: boolean = false;
  newSubject: string = '';
  timetableId: number | null = null;
  year: number | null = null;
  semester: number | null = null;
  academicYear: string | null = null;
  crcId: number | null = null;
  branch:string | null  = null;

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadSubjectsFromBackend();
    this.loadFacultyFromBackend();
  
    const crcDetails = this.userService.getCRCDetails();
    if (crcDetails) {
      this.crcId = crcDetails.crcId;
      this.year = crcDetails.year;
      this.semester = crcDetails.semester;
      this.academicYear = crcDetails.academic_year;
      this.branch = crcDetails.branch;
    }
  
    this.loadTimetable(); // ✅ Load local first, then backend
  }
  

  loadSubjectsFromBackend() {
    this.userService.getSubjects().subscribe(data => {
      this.subjects = data;
    }, error => {
      console.error("Error loading subjects:", error);
    });
  }

  addSubject() {
    if (this.newSubject.trim() && !this.subjects.some(subject => subject.name === this.newSubject)) {
      this.userService.addSubject({ name: this.newSubject }).subscribe(response => {
        this.subjects.push(response);
        this.newSubject = '';
      }, error => {
        console.error("Error adding subject:", error);
      });
    }
  }

  deleteSubject(subjectId: number) {
    this.userService.deleteSubject(subjectId).subscribe(() => {
      this.subjects = this.subjects.filter(subject => subject.id !== subjectId);
    }, error => {
      console.error("Error deleting subject:", error);
    });
  }

  loadFacultyFromBackend() {
    this.userService.getFaculties().subscribe(data => {
      this.facultyList = data.map((faculty: { id: number, full_name: string }) => ({
        id: faculty.id,
        full_name: faculty.full_name
      }));
    }, error => {
      console.error("Error loading faculty list:", error);
    });
  }

  loadTimetable() {
    // ✅ Step 1: Load from local storage first (so the UI doesn't reset)
    const savedTimetable = localStorage.getItem('crcTimetable');
    const savedFinalizedStatus = localStorage.getItem('crcSemesterFinalized');
  
    if (savedTimetable) {
      this.timetable = JSON.parse(savedTimetable);
    } else {
      this.initializeTimetable();
    }
  
    if (savedFinalizedStatus) {
      this.semesterFinalized = JSON.parse(savedFinalizedStatus);
    }
  
    // ✅ Step 2: Fetch latest timetable from backend and update local storage
    this.userService.getTimetables().subscribe(
      data => {
        if (data.length > 0) {
          this.timetableId = data[0].id;
          this.semesterFinalized = data[0].is_finalized;
          this.timetable = this.processTimetableData(data[0].entries);
  
          // ✅ Step 3: Update local storage only if backend data is received
          localStorage.setItem('crcTimetable', JSON.stringify(this.timetable));
          localStorage.setItem('crcSemesterFinalized', JSON.stringify(this.semesterFinalized));
        }
      },
      error => {
        console.error("Error loading timetable from backend, using local storage:", error);
      }
    );
  }
  

  loadTimetableFromBackend() {
    this.userService.getTimetables().subscribe(data => {
      if (data.length > 0) {
        this.timetableId = data[0].id;
        this.semesterFinalized = data[0].is_finalized; // ✅ Update finalization status
        this.timetable = this.processTimetableData(data[0].entries);
  
        // ✅ Update local storage to match backend
        localStorage.setItem('crcTimetable', JSON.stringify(this.timetable));
        localStorage.setItem('crcSemesterFinalized', JSON.stringify(this.semesterFinalized));
      } else {
        this.initializeTimetable();
      }
    }, error => {
      console.error("Error loading timetable:", error);
    });
  }
  
  
  
  prepareTimetableEntries() {
    const timetableEntries = [] as any[];
  
    for (let day of this.days) {
      if (!this.timetable[day]) continue;
  
      this.timetable[day].forEach((slot, index) => {
        if (slot.subject_id && slot.faculty_id) {
          timetableEntries.push({
            day: day,
            time_slot: this.timeSlots[index].time,
            subject_id: slot.subject_id,
            faculty_id: slot.faculty_id
          });
        }
      });
    }
  
    return timetableEntries;
  }
  
  processTimetableData(entries: any[]): { [day: string]: TimetableEntry[] } {
    let processedTimetable: { [day: string]: TimetableEntry[] } = {};
    this.days.forEach(day => {
      processedTimetable[day] = this.timeSlots.map(() => ({ subject_id: null, faculty_id: null }));
    });

    entries.forEach(entry => {
      const slotIndex = this.timeSlots.findIndex(slot => slot.time === entry.time_slot);
      if (slotIndex !== -1 && processedTimetable[entry.day]) {
        processedTimetable[entry.day][slotIndex] = {
          subject_id: entry.subject,
          faculty_id: entry.faculty
        };
      }
    });

    return processedTimetable;
  }

  initializeTimetable() {
    this.days.forEach(day => {
      if (!this.timetable[day]) {
        this.timetable[day] = this.timeSlots.map(() => ({ subject_id: null, faculty_id: null }));
      }
    });
  }

  finalizeTimetable() {
    this.semesterFinalized = true;
    this.saveToLocalStorage();
    this.showSaveToBackendButton = true;
    alert('Timetable finalized. Click "Save to Backend" to store it online.');
  }

  saveTimetableToBackend() {
    if (!this.crcId || !this.year || !this.semester || !this.academicYear) {
      alert('CRC details are missing. Please try again.');
      return;
    }
  
    const timetableData = {
      crc_id: this.crcId,
      branch: "CSE",
      year: this.year,
      semester: this.semester,
      academic_year: this.academicYear,
      is_finalized: this.semesterFinalized,
      entries: this.prepareTimetableEntries()
    };
  
    this.userService.addTimetable(timetableData).subscribe(response => {
      this.timetableId = response.id;
  
      // ✅ Update local storage with finalized timetable
      localStorage.setItem('crcTimetable', JSON.stringify(this.timetable));
      localStorage.setItem('crcSemesterFinalized', JSON.stringify(this.semesterFinalized));
  
      alert('Timetable successfully saved online!');
      this.showSaveToBackendButton = false;
    }, error => {
      console.error("Error saving timetable to backend:", error);
    });
  }
  
  
  
  updateEntry(day: string, slotIndex: number, type: 'subject' | 'faculty', value: number | null) {
    if (this.semesterFinalized) {
      alert('Timetable is finalized. Editing is restricted.');
      return;
    }

    if (!this.timetable[day]) return;

    if (type === 'subject') {
      this.timetable[day][slotIndex].subject_id = value;
    } else if (type === 'faculty') {
      this.timetable[day][slotIndex].faculty_id = value;
    }

    this.saveToLocalStorage();
  }
  saveToLocalStorage() {
    localStorage.setItem('crcTimetable', JSON.stringify(this.timetable));
    localStorage.setItem('crcSemesterFinalized', JSON.stringify(this.semesterFinalized));
  }

  getSubjectName(subjectId: number | null): string {
    const subject = this.subjects.find(s => s.id === subjectId);
    return subject ? subject.name : '—';
  }
  
  getFacultyName(facultyId: number | null): string {
    const faculty = this.facultyList.find(f => f.id === facultyId);
    return faculty ? faculty.full_name : '—';
  }

}
