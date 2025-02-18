import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CrcDashboardComponent } from './crc-dashboard/crc-dashboard.component';
import { CrcTimetableComponent } from './crc-timetable/crc-timetable.component';

@NgModule({
  declarations: [
    // CrcAuthComponent,
    CrcDashboardComponent,
    CrcTimetableComponent,
  ],
  imports: [CommonModule, FormsModule, RouterModule],
})
export class CrcModule {}
