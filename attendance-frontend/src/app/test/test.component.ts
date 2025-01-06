import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';  // Import HttpClient
@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrl: './test.component.css'
})
export class TestComponent implements OnInit{
  attendanceMessage: string = '';
  adminLatitude: number | null = null;
  adminLongitude: number | null = null;
  studentLatitude: number | null = null;
  studentLongitude: number | null = null;
  distance: number | null = null;
  attendanceStatus: string | null = null;

  constructor(private http: HttpClient) {}  // Inject HttpClient

  ngOnInit() {
    // Make a GET request to your backend API
    this.http.get<any>('http://127.0.0.1:8000/attendanc_test/')
      .subscribe(response => {
        console.log(response);
        this.attendanceMessage = response.message; // Update with message from backend
        // console.log("attendanceMessage",this.attendanceMessage);
      }, error => {
        console.error('Error:', error);
      });
  }
   // Method to calculate distance
  calculateDistance() {
    if (
      this.adminLatitude !== null &&
      this.adminLongitude !== null &&
      this.studentLatitude !== null &&
      this.studentLongitude !== null
    ) {
      // Haversine formula
      const R = 6371000; // Radius of Earth in meters
      const dLat = this.degToRad(this.studentLatitude - this.adminLatitude);
      const dLon = this.degToRad(this.studentLongitude - this.adminLongitude);
      const lat1 = this.degToRad(this.adminLatitude);
      const lat2 = this.degToRad(this.studentLatitude);

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      this.distance = R * c; // Distance in meters

      // Round to two decimal places for readability
      this.distance = parseFloat(this.distance.toFixed(2));
      console.log('Distance in meters:', this.distance);

      // Determine attendance status
      if (this.distance <= 20) {
        this.attendanceStatus = 'Attended';
      } else {
        this.attendanceStatus = 'Absent';
      }
      console.log('Attendance Status:', this.attendanceStatus);
    } else {
      console.error('Coordinates are missing for distance calculation');
      alert('Please ensure both admin and student coordinates are provided');
    }
  }

  getAdminLocation() {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Raw Admin Location:', position.coords);
        this.adminLatitude = position.coords.latitude;
        this.adminLongitude = position.coords.longitude;
  
        // Log explicitly for debugging
        console.log('Admin Latitude:', position.coords.latitude);
        console.log('Admin Longitude:', position.coords.longitude);
      },
      (error) => console.error('Error fetching admin location', error),
      { enableHighAccuracy: true }
    );
  }
  
  getStudentLocation() {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Assign full precision directly
        this.studentLatitude = position.coords.latitude;
        this.studentLongitude = position.coords.longitude;
  
        // Log full precision values
        console.log('Student Full Precision Location:', position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.error('Error fetching student location', error);
        alert('Unable to fetch student location. Please check permissions or enable high-accuracy mode.');
      },
      { enableHighAccuracy: true }
    );
  }

  // Helper method to convert degrees to radians
  degToRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
