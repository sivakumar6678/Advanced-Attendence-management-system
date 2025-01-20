import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import * as faceapi from 'face-api.js';

@Component({
  selector: 'app-student-auth',
  templateUrl: './student-auth.component.html',
  styleUrls: ['./student-auth.component.css']
})
export class StudentAuthComponent  {
  // loginVideo!: HTMLVideoElement;
  // registerVideo!: HTMLVideoElement;

  // // Registration fields
  // studentId = '';
  // name = '';
  // email = '';
  // password = '';
  // confirmPassword = '';
  // branch = '';
  // year = '';
  // phoneNumber = '';
  // academicYear = '';
  // isLateralEntry = false;
  // descriptor: Float32Array | null = null; // Update type here

  // // Login fields
  // loginStudentIdOrEmail = '';
  // loginPassword = '';

  // isRegistering = true; // Toggle between register/login
  // isLogin: boolean = false; // Track if we are on the Login form

  // constructor(private authService: AuthService) {}

  // async ngOnInit() {
  //   this.isLogin = true;
  //   // Load face-api.js models
  //   await this.loadFaceApiModels();
  //   // Start video for registration
  //   await this.startVideo('videoElement');
  // }

  // async loadFaceApiModels() {
  //   await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
  //   await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
  //   await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
  // }

  // // Start video stream
  // async startVideo(videoElementId: string) {
  //   const video = document.getElementById(videoElementId) as HTMLVideoElement;
  //   if (video) {
  //     const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
  //     video.srcObject = stream;
  //     video.play();
  //   } else {
  //     alert('Video element not found.');
  //   }
  // }

  // // Capture face for registration
  // async handleCapture() {
  //   const videoElement = document.getElementById('videoElement') as HTMLVideoElement;
  //   if (videoElement) {
  //     const detection = await faceapi.detectSingleFace(videoElement).withFaceLandmarks().withFaceDescriptor();
  //     if (detection) {
  //       this.descriptor = detection.descriptor;
  //       alert('Face captured successfully!');
  //     } else {
  //       alert('No face detected.');
  //     }
  //   } else {
  //     alert('Video element not found.');
  //   }
  // }

  // // Handle registration
  // onRegisterSubmit() {
  //   if (this.password !== this.confirmPassword) {
  //     alert('Passwords do not match!');
  //     return;
  //   }

  //   const data = {
  //     studentId: this.studentId,
  //     name: this.name,
  //     email: this.email,
  //     password: this.password,
  //     branch: this.branch,
  //     year: this.year,
  //     phoneNumber: this.phoneNumber,
  //     academicYear: this.academicYear,
  //     isLateralEntry: this.isLateralEntry,
  //     descriptor: this.descriptor
  //   };

  //   if (this.descriptor) {
  //     this.authService.registerStudent(data, this.descriptor).subscribe(
  //       (res) => {
  //         alert('Registration successful!');
  //         this.clearForm();
  //       },
  //       (err) => {
  //         alert('Registration failed.');
  //       }
  //     );
  //   } else {
  //     alert('Face descriptor is null. Please capture your face again.');
  //   }
  // }

  // // Handle login
  // onLoginSubmit() {
  //   const data = {
  //     studentIdOrEmail: this.loginStudentIdOrEmail,
  //     password: this.loginPassword,
  //   };

  //   this.authService.loginStudent(data).subscribe(
  //     (res) => {
  //       alert('Login successful!');
  //       this.clearForm();
  //     },
  //     (err) => {
  //       alert('Login failed.');
  //     }
  //   );
  // }

  // // Toggle between register and login forms
  // toggleForm() {
  //   this.isLogin = !this.isLogin;
  //   this.clearForm();
  // }

  // clearForm() {
  //   this.studentId = '';
  //   this.name = '';
  //   this.email = '';
  //   this.password = '';
  //   this.confirmPassword = '';
  //   this.branch = '';
  //   this.year = '';
  //   this.phoneNumber = '';
  //   this.academicYear = '';
  //   this.isLateralEntry = false;
  //   this.descriptor = null;
  //   this.loginStudentIdOrEmail = '';
  //   this.loginPassword = '';
  // }
}
