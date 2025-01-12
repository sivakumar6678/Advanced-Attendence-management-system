import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  features = [
    { icon: 'group', title: 'Role Management', description: 'Dynamic roles for CRC, Teachers, and HODs.' },
    { icon: 'gps_fixed', title: 'GPS Attendance', description: 'Mark attendance using GPS.' },
    { icon: 'face', title: 'Face Recognition', description: 'Secure with facial authentication.' },
    { icon: 'schedule', title: 'Timetable Management', description: 'Adjust timetables effortlessly.' },
    { icon: 'security', title: 'Blockchain Secure', description: 'Data integrity via blockchain.' },
  ];

  roles = [
    { icon: 'person', name: 'CRC', description: 'Class Responsibility Coordinator for timetables.' },
    { icon: 'school', name: 'Teacher', description: 'Mark attendance and manage classes.' },
    { icon: 'supervisor_account', name: 'HOD', description: 'Oversee department operations.' },
  ];
}
