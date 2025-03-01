import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-crc-dashboard',
  templateUrl: './crc-dashboard.component.html',
  styleUrl: './crc-dashboard.component.css'
})
export class CrcDashboardComponent implements OnInit {
  crcProfile: any;
  

  constructor(private crcDashboardService: UserService,
              private router: Router
  ) {}

  ngOnInit(): void {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('access_token')}`);
  
    this.crcDashboardService.getCrcProfile(headers).subscribe(
      (data) => {
        this.crcProfile = data;
        console.log('CRC Profile:', this.crcProfile);
      },
      (error) => {
        console.error('Authorization failed', error);
        this.router.navigate(['/crc/login']); // Redirect if unauthorized
      }
    );
  }
  

}
