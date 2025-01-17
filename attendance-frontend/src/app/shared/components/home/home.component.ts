import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { trigger, style, animate, transition, state } from '@angular/animations';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  animations: [
    trigger('fadeIn', [
      state('in', style({ opacity: 1, transform: 'translateY(0)' })),
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.8s ease-in-out'),
      ]),
    ]),
  ],
})
export class HomeComponent implements OnInit{
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }
  showLoginSection = false;
  menuOpen : boolean = false;
  constructor(private router: Router) {}
  
  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }
  
  toggleLoginSection(): void {
    this.showLoginSection = !this.showLoginSection;
  }

  navigateToLogin(role: string): void {
    // Navigate to the respective login page with role as query parameter
    this.router.navigate(['/login'], { queryParams: { role } });
    this.toggleLoginSection(); // Close the popup
  }
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
