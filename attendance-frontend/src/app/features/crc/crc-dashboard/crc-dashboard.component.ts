import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
@Component({
  selector: 'app-crc-dashboard',
  templateUrl: './crc-dashboard.component.html',
  styleUrl: './crc-dashboard.component.css'
})
export class CrcDashboardComponent implements OnInit {
  crcProfile: any;
  

  constructor(private crcDashboardService: UserService) {}

  ngOnInit(): void {
    this.crcDashboardService.getCrcProfile().subscribe(
      (data) => {
        this.crcProfile = data;
      },
      (error) => {
        // this.error = error.message;
      }
    );
  }

}
