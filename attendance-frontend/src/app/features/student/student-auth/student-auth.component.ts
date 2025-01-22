import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import * as faceapi from 'face-api.js';
import * as tf from '@tensorflow/tfjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import {ChangeDetectionStrategy,  signal} from '@angular/core';

@Component({
  selector: 'app-student-auth',
  templateUrl: './student-auth.component.html',
  styleUrls: ['./student-auth.component.css']
})
export class StudentAuthComponent implements OnInit {
  videoElement!: HTMLVideoElement;
  faceDescriptor: Float32Array | null = null;
  cameraEnabled = false;
  registerfaceoption = false;

  // Registration fields
  studentId = '';
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  branch = '';
  year = '';
  semester = '';
  phoneNumber = '';
  academicYear = '';
  isLateralEntry = false;

  // Login fields
  loginStudentIdOrEmail = '';
  loginPassword = '';

  isLogin: boolean = false; // Track if we are on the Login form
  faceRegistered: boolean = false; // Track if face is registered

  // Options for dropdowns
  branchOptions = ['CSE', 'ECE', 'MECH', 'EEE', 'CIV', 'FDT'];
  yearOptions = [1, 2, 3, 4];
  semesterOptions = [1, 2];
  academicYearOptions = ['2021-2025', '2022-2026', '2023-2027', '2024-2028'];

  hide = signal(true);
  clickEvent(event: MouseEvent) {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }
  constructor(private authService: AuthService,private snackBar: MatSnackBar) {}

  async ngOnInit() {
    await tf.setBackend('webgl'); // Set the backend to WebGL
    // this.isLogin = true;
    await this.loadFaceApiModels();
  }

  async loadFaceApiModels() {
    try {
      await faceapi.nets.ssdMobilenetv1.loadFromUri('/assets/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/assets/models');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/assets/models');
      console.log('Face API models loaded successfully!');
    } catch (error) {
      console.error('Error loading Face API models:', error);
    }
  }

  async startVideo() {
    this.videoElement = document.getElementById('videoElement') as HTMLVideoElement;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.videoElement.srcObject = stream;
      this.videoElement.play();
      this.cameraEnabled = true;
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access your camera. Please check your permissions.');
    }
  }

  stopVideo() {
    if (this.videoElement && this.videoElement.srcObject) {
      const stream = this.videoElement.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      this.videoElement.srcObject = null;
      this.cameraEnabled = false;
      this.registerfaceoption = false;
    }
  }

  async captureFace() {
    console.log('Capturing face...');
    if (!this.videoElement) {
      alert('Camera is not enabled.');
      return;
    }
    
    try {
      const detection = await faceapi
      .detectSingleFace(this.videoElement)
      .withFaceLandmarks()
      .withFaceDescriptor();
      
      if (detection) {
        this.faceDescriptor = detection.descriptor;
        this.faceRegistered = true; // Set this to true after successful face capture
        alert('Face captured successfully!');
        this.registerfaceoption = false;
        this.stopVideo();
      } else {
        alert('No face detected. Please try again.');
      }
    } catch (error) {
      console.error('Error capturing face:', error);
      alert('Error capturing face. Please try again.');
    }
  }
RegisterFace() {
  this.registerfaceoption = true;
    this.startVideo();
  }
  onRegisterSubmit() {
    if (!this.faceRegistered || !this.faceDescriptor) {
      alert('Face is not registered. Please register your face before submitting.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    const data = {
      studentId: this.studentId,
      name: this.name,
      email: this.email,
      password: this.password,
      branch: this.branch,
      year: this.year,
      semester: this.semester,
      phoneNumber: this.phoneNumber,
      academicYear: this.academicYear,
      isLateralEntry: this.isLateralEntry,
      faceDescriptor: this.faceDescriptor,
    };

    this.authService.registerStudent(data).subscribe(
      (res) => {
        alert('Registration successful!');
        this.clearForm();
      },
      (err) => {
        alert('Registration failed.');
      }
    );
  }

  onLoginSubmit() {
    const data = {
      studentIdOrEmail: this.loginStudentIdOrEmail,
      password: this.loginPassword
    };

    this.authService.loginStudent(data).subscribe(
      (res) => {
        alert('Login successful!');
        this.clearForm();
      },
      (err) => {
        alert('Login failed.');
      }
    );
  }

  toggleForm() {
    this.isLogin = !this.isLogin;
    this.clearForm();
    if (this.cameraEnabled) {
      this.stopVideo(); // Stop the video when switching forms
    }
  }

  clearForm() {
    this.studentId = '';
    this.name = '';
    this.email = '';
    this.password = '';
    this.confirmPassword = '';
    this.branch = '';
    this.year = '';
    this.semester = '';
    this.phoneNumber = '';
    this.academicYear = '';
    this.isLateralEntry = false;
    this.faceDescriptor = null;
    this.faceRegistered = false;
    this.loginStudentIdOrEmail = '';
    this.loginPassword = '';
  }

  onLateralEntryChange() {
    if (this.isLateralEntry) {
      this.snackBar.open('You are registering as a Lateral Entry student. You will join the original batch and complete 3 years.', 'Close', {
        duration: 4000, // Duration in milliseconds
        horizontalPosition: 'center', // Position on the x-axis
        verticalPosition: 'top', // Position on the y-axis
      });
    } else {
      this.snackBar.open('You are registering as a regular 4-year student.', 'Close', {
        duration: 4000, // Duration in milliseconds
        horizontalPosition: 'center', // Position on the x-axis
        verticalPosition: 'top', // Position on the y-axis
      });
    }
  }
  
  
}