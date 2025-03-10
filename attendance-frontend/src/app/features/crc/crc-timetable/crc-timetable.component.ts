import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { ChangeDetectorRef } from '@angular/core';
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
  
  timetable: { [day: string]: TimetableEntry[] } = {};
  subjects: any[] = [];
  facultyList: any[] = [];
  
  crcId: number | null = null;
  year: number | null = null;
  semester: number | null = null;
  academicYear: string | null = null;
  branch:string | null  = null;

  semesterFinalized: boolean = false;
  showSaveToBackendButton: boolean = false;
  timetableId: number | null = null;
  
  newSubject: string = '';
  

  constructor(private userService: UserService,private cdRef: ChangeDetectorRef) {}

  
  ngOnInit() {
    const crcDetails = this.userService.getCRCDetails();
    if (crcDetails) {
      this.crcId = crcDetails.crcId;
      this.year = crcDetails.year;
      this.semester = crcDetails.semester;
      this.academicYear = crcDetails.academic_year;
      this.branch = crcDetails.branch;
    }
    this.loadSubjects();
    this.loadFacultyFromBackend();
    this.loadTimetable();
    // this.loadTimetableFromBackend(); // Always fetch fresh data on login
    // console.log("timetalbe form backend ",this.timetable);
  }
  

  loadSubjects() {
    const crcDetails = this.userService.getCRCDetails();
    this.crcId = crcDetails.crcId;

    // console.log("CRC ID ",crcDetails.crcId);
    if (!this.crcId) return;

    this.userService.getSubjects(this.crcId).subscribe(
      (data) => {
        this.subjects = data;
        console.log("Subject are ",this.subjects);
      },
      (error) => {
        console.error("Error loading subjects:", error);
      }
    );
  }

  addSubject() {
    if (!this.newSubject.trim() || !this.crcId) {
      alert("Invalid subject name or missing CRC ID.");
      return;
    }
    this.userService.addSubject(this.newSubject, this.crcId).subscribe(
      (response) => {
        this.subjects.push(response);
        this.newSubject = ''; // Clear input field
      },
      (error) => {
        console.error("Error adding subject:", error);
        alert(error.error?.error || "Failed to add subject.");
      }
    );
  }

  deleteSubject(subjectId: number) {
    this.userService.deleteSubject(subjectId).subscribe(
      () => {
        this.subjects = this.subjects.filter((subject) => subject.id !== subjectId);
      },
      (error) => {
        console.error("Error deleting subject:", error);
      }
    );
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
  
    // ✅ Step 2: Fetch latest timetable from backend only if needed
    if (!this.timetableId) {
      this.loadTimetableFromBackend();
    }
  }
  
  loadTimetableFromBackend() {
    console.log("Loading timetable from backend: ", this.crcId, this.year, this.semester, this.branch, this.academicYear);
    
    if (!this.crcId || !this.year || !this.semester || !this.branch || !this.academicYear) {
      console.error("Missing required parameters to fetch timetable.");
      return;
    }
  
    this.userService.getTimetables(this.crcId, this.year, this.semester, this.branch, this.academicYear)
      .subscribe(data => {
        console.log("Timetable from backend: ", data);
        
        if (data.length > 0) {
          this.timetableId = data[0].id;
          this.semesterFinalized = data[0].is_finalized;
          this.timetable = this.processTimetableData(data[0].entries);
          console.log("Processed Timetable:", this.timetable);  // ✅ Check processed data
          localStorage.setItem('crcTimetable', JSON.stringify(this.timetable));
          localStorage.setItem('crcSemesterFinalized', JSON.stringify(this.semesterFinalized));
  
          this.cdRef.detectChanges();  // ✅ Ensures UI updates properly
        } else {
          this.initializeTimetable();
        }
      }, error => {
        console.error('Error loading timetable:', error);
      });
  }

  processTimetableData(entries: any[]): { [day: string]: TimetableEntry[] } {
    console.log("Raw Entries:", entries);  // ✅ Debugging API response
  
    let processedTimetable: { [day: string]: TimetableEntry[] } = {};
    this.days.forEach(day => {
      processedTimetable[day] = this.timeSlots.map(() => ({ subject_id: null, faculty_id: null }));
    });
  
    entries.forEach(entry => {
      console.log("Processing Entry:", entry);  // ✅ Check each entry structure
  
      const slotIndex = this.timeSlots.findIndex(slot => slot.time === entry.time_slot);
      if (slotIndex !== -1 && processedTimetable[entry.day]) {
        processedTimetable[entry.day][slotIndex] = {
          subject_id: entry.subject_id ?? null,  // ✅ Use `subject_id` instead of `subject`
          faculty_id: entry.faculty_id ?? null   // ✅ Use `faculty_id` instead of `faculty`
        };
      } else {
        console.warn(`Time slot not found for entry:`, entry);  // ✅ Debugging log
      }
    });
  
    console.log("Final Processed Timetable:", processedTimetable);  // ✅ Verify final output
    return processedTimetable;
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

  initializeTimetable() {
    this.days.forEach(day => {
      if (!this.timetable[day]) {
        this.timetable[day] = this.timeSlots.map(() => ({ subject_id: null, faculty_id: null }));
      }
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

  saveTimetableToBackend() {
    if (!this.crcId || !this.year || !this.semester || !this.academicYear) {
      alert('CRC details are missing. Please try again.');
      return;
    }

    const timetableData = {
      crc_id: this.crcId,
      branch: this.branch,
      year: this.year,
      semester: this.semester,
      academic_year: this.academicYear,
      is_finalized: this.semesterFinalized,
      entries: this.prepareTimetableEntries()
    };

    this.userService.addTimetable(timetableData).subscribe(
      response => {
        this.timetableId = response.id;
        alert('Timetable successfully saved online!');
        this.showSaveToBackendButton = false;
      },
      error => {
        console.error('Error saving timetable to backend:', error);
      }
    );
  }

  
  finalizeTimetable() {
    this.semesterFinalized = true;
    this.showSaveToBackendButton = true;

    alert('Timetable finalized. Click "Save to Backend" to store it online.');
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
