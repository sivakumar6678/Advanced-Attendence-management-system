import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as faceapi from 'face-api.js';  // Import face-api.js

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css']
})
export class TestComponent implements OnInit {
  attendanceMessage: string = '';
  adminLatitude: number | null = null;
  adminLongitude: number | null = null;
  studentLatitude: number | null = null;
  studentLongitude: number | null = null;
  distance: number | null = null;
  attendanceStatus: string | null = null;

  // Variables for Face Recognition
  videoElement: HTMLVideoElement | null = null;
  canvas: HTMLCanvasElement | null = null;
  isFaceDetected: boolean = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Load the face-api.js models when the component initializes
    this.loadFaceApiModels();

    // Make a GET request to your backend API
    this.http.get<any>('http://127.0.0.1:8000/attendanc_test/')
      .subscribe(response => {
        this.attendanceMessage = response.message;
      }, error => {
        console.error('Error:', error);
      });
  }

  // Method to load face-api.js models
  async loadFaceApiModels() {
    await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
    await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
  }

  // Method to start the webcam and detect faces
  startWebcam() {
    this.videoElement = <HTMLVideoElement>document.getElementById('videoInput');
    navigator.mediaDevices.getUserMedia({ video: {} })
      .then((stream) => {
        this.videoElement!.srcObject = stream;
        this.videoElement!.play();
      })
      .catch((err) => {
        console.error('Error accessing webcam:', err);
      });
  }

  // Method to detect face in the video stream
  async detectFace() {
    if (this.videoElement) {
      const detections = await faceapi.detectAllFaces(this.videoElement)
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length > 0) {
        this.isFaceDetected = true;
        console.log('Face Detected');
      } else {
        this.isFaceDetected = false;
        console.log('No Face Detected');
      }

      // Draw face detection results on canvas
      const canvas = faceapi.createCanvasFromMedia(this.videoElement);
      document.body.append(canvas);
      faceapi.matchDimensions(canvas, this.videoElement);
      faceapi.draw.drawDetections(canvas, detections);
      faceapi.draw.drawFaceLandmarks(canvas,detections);
    }
  }

  // Method to stop the webcam
  stopWebcam() {
    if (this.videoElement && this.videoElement.srcObject) {
      const stream = <MediaStream>this.videoElement.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
    }
    this.videoElement = null;
  }

  // Method to calculate distance between admin and student locations
  calculateDistance() {
    if (this.adminLatitude !== null && this.adminLongitude !== null && this.studentLatitude !== null && this.studentLongitude !== null) {
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
      this.distance = parseFloat(this.distance.toFixed(2)); // Round to two decimal places

      // Determine attendance status based on distance
      if (this.distance <= 20) {
        this.attendanceStatus = 'Attended';
      } else {
        this.attendanceStatus = 'Absent';
      }
    } else {
      alert('Coordinates are missing for distance calculation');
    }
  }

  // Helper method to convert degrees to radians
  degToRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Get Admin Location
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

  // Get Student Location
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
}
