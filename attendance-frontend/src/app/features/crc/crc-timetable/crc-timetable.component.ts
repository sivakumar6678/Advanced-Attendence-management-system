import { Component, OnInit } from '@angular/core';

interface TimetableSlot {
  time: string;
  isEditable: boolean;
}

interface TimetableEntry {
  subject: string;
  faculty: string;
}

@Component({
  selector: 'app-crc-timetable',
  templateUrl: './crc-timetable.component.html',
  styleUrls: ['./crc-timetable.component.css']
})
export class CrcTimetableComponent implements OnInit {
  days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  timeSlots: TimetableSlot[] = [];
  subjects: string[] = [];
  facultyList = ['Mrs. G Thapaswini', 'Mr. B Nagabhushana Babu', 'Dr. Y Saritha', 'Dr. B Rajini', 'V Saritha', 'M V Kesava Kumar'];

  timetable: { [day: string]: TimetableEntry[] } = {};
  semesterFinalized: boolean = false;

  newSubject: string = ''; 
  isEditDialogVisible: boolean = false;
  editingTimeSlotIndex: number | null = null;
  newTimeSlot: string = '';

  constructor() {
    this.loadTimetableFromStorage();
  }

  ngOnInit() {
    this.loadTimetableFromStorage();
  }

  initializeDefaultTimeSlots() {
    return [
      { time: '9:15 AM - 10:15 AM', isEditable: true },
      { time: '10:15 AM - 11:15 AM', isEditable: true },
      { time: '11:30 AM - 12:30 PM', isEditable: true },
      { time: '1:30 PM - 2:30 PM', isEditable: true },
      { time: '2:30 PM - 3:30 PM', isEditable: true },
      { time: '3:30 PM - 4:30 PM', isEditable: true }
    ];
  }

  loadTimetableFromStorage() {
    const savedTimetable = localStorage.getItem('crcTimetable');
    const savedSubjects = localStorage.getItem('crcSubjects');
    const savedFinalizedStatus = localStorage.getItem('crcSemesterFinalized');

    this.timeSlots = this.initializeDefaultTimeSlots();
    this.timetable = savedTimetable ? JSON.parse(savedTimetable) : {};
    this.subjects = savedSubjects ? JSON.parse(savedSubjects) : [];
    this.semesterFinalized = savedFinalizedStatus ? JSON.parse(savedFinalizedStatus) : false;

    this.initializeTimetable();
  }

  initializeTimetable() {
    this.days.forEach(day => {
      if (!this.timetable[day]) {
        this.timetable[day] = this.timeSlots.map(() => ({ subject: '', faculty: '' }));
      }
    });
  }

  addSubject() {
    if (this.newSubject.trim() && !this.subjects.includes(this.newSubject)) {
      this.subjects.push(this.newSubject);
      this.saveTimetableToStorage();
      this.newSubject = '';
    }
  }

  deleteSubject(index: number) {
    this.subjects.splice(index, 1);
    this.saveTimetableToStorage();
  }

  updateEntry(day: string, slotIndex: number, type: 'subject' | 'faculty', value: string) {
    if (this.semesterFinalized) {
      alert('Timetable is finalized. Editing is restricted.');
      return;
    }
    if (type === 'subject') {
      this.timetable[day][slotIndex].subject = value;
    } else if (type === 'faculty') {
      this.timetable[day][slotIndex].faculty = value;
    }
    this.saveTimetableToStorage();
  }

  openEditTimeSlotDialog(index: number) {
    if (this.semesterFinalized) {
      alert('Time slots cannot be changed after finalization.');
      return;
    }
    this.editingTimeSlotIndex = index;
    this.newTimeSlot = this.timeSlots[index].time;
    this.isEditDialogVisible = true;
  }

  saveTimeSlot() {
    if (this.editingTimeSlotIndex !== null) {
      this.timeSlots[this.editingTimeSlotIndex].time = this.newTimeSlot;
      this.editingTimeSlotIndex = null;
      this.isEditDialogVisible = false;
      this.saveTimetableToStorage();
    }
  }

  finalizeTimetable() {
    this.semesterFinalized = true;
    this.saveTimetableToStorage();
    alert('Timetable has been finalized for the semester.');
  }

  saveTimetableToStorage() {
    localStorage.setItem('crcTimetable', JSON.stringify(this.timetable));
    localStorage.setItem('crcSubjects', JSON.stringify(this.subjects));
    localStorage.setItem('crcSemesterFinalized', JSON.stringify(this.semesterFinalized));
  }
}
