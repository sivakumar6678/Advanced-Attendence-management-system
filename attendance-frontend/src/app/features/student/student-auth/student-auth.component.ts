import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import * as faceapi from 'face-api.js';
import * as tf from '@tensorflow/tfjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { UserService } from '../../../core/services/user.service';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
@Component({
  selector: 'app-student-auth',
  templateUrl: './student-auth.component.html',
  styleUrls: ['./student-auth.component.css'],
  animations: [
    trigger('formTransition', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0 })),
      ]),
    ]),
  ],
})
export class StudentAuthComponent implements OnInit {
  // viedeo elemets 
  videoElement!: HTMLVideoElement;
  faceDescriptor: Float32Array | null = null;
  cameraEnabled = false;
  registerfaceoption = false;
  active: number | undefined = 0;
  
  // Registration fields
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  branch = '';
  year = '';
  semester = '';
  phoneNumber = '';
  phoneNumber1 = '';
  parentsPhoneNumber = '';
  academicYear = '';
  isLateralEntry = false;

  // Login fields
  loginStudentIdOrEmail = '';
  loginPassword = '';

  isLogin: boolean = true; // Track if we are on the Login form
  faceRegistered: boolean = false; // Track if face is registered
  loading: boolean = false;

  // Options for dropdowns
  academicYearOptions: any[] = [];
  branchOptions: any[] = [];
  // branchOptions = ['CSE', 'ECE', 'MECH', 'EEE', 'CIV', 'FDT'];
  yearOptions = [1, 2, 3, 4];
  semesterOptions = [1, 2];
  // academicYearOptions = ['2021-2025', '2022-2026', '2023-2027', '2024-2028'];

  firstFormGroup: FormGroup;
  secondFormGroup: FormGroup;
  thirdFormGroup: FormGroup;

  hide: boolean = true;

  // Device registration 
  // deviceFingerprint: string = '';
  // userAgent: string = navigator.userAgent;
  // ipAddress: string = '';
  deviceId: string | null = null;
  deviceRegistered: boolean = false;  // To track device registration

  constructor(private authService: AuthService,
              private userService: UserService,
              private router: Router,
              private snackBar: MatSnackBar,
              private messageService:MessageService,
              private _formBuilder: FormBuilder) {
    this.firstFormGroup = this._formBuilder.group({
      // studentId: ['', Validators.required],
      // name : ['', Validators.required],
      // email: ['', [Validators.required, Validators.email]],
      // phoneNumber: [''],
      // phoneNumber1: [''],
      // password: ['', Validators.required],
      // confirmPassword: ['', Validators.required],
      // branch: ['', Validators.required],
      // year: ['', Validators.required],
      // semester: ['', Validators.required],
      // academicYear: ['', Validators.required],
      // isLateralEntry: [false],
      studentId: [''],
      name : [''],
      email: [''],
      phoneNumber: [''],
      phoneNumber1: [''],
      password: [''],
      confirmPassword: [''],
      branch: ['',],
      year: [''],
      semester: [''],
      academicYear: [''],
      isLateralEntry: [false],
    });

    this.secondFormGroup = this._formBuilder.group({});
    this.thirdFormGroup = this._formBuilder.group({
      deviceId: ['', Validators.required],
    });
  }
  async ngOnInit() {

    this.firstFormGroup = this._formBuilder.group({
      studentId: [''],
      name: [''],
      email: [''],
      phoneNumber: [''],
      phoneNumber1: [''],
      password: [''],
      confirmPassword: [''],
      year: [''],
      semester: [''],
      academicYear: [''],
      branch: [''],
      isLateralEntry: [false],
    });
    // console.log('form is lateral enry', this.firstFormGroup.value.isLateralEntry);
    // Fetch branches
    this.userService.getBranches().subscribe((data: any) => {
      this.branchOptions = data;
      console.log('Branches:', this.branchOptions);
    });

    // Fetch academic years
    this.userService.getAcademicYears().subscribe((data: any) => {
      this.academicYearOptions = data;
      console.log('Academic years:', this.academicYearOptions);
    });
    await tf.setBackend('webgl'); // Set the backend to WebGL
    await this.loadFaceApiModels();
    this.deviceId = await this.authService.getDeviceId();


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
    this.loading = true;
    console.log("loading",this.loading);
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
        this.messageService.add({key:'toast1', severity:'error', summary:'Error', detail:'Error capturing face. Please try again.'});
        this.snackBar.open('Error capturing face. Please try again.', 'Close', {
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error capturing face:', error);
      this.messageService.add({key:'toast1', severity:'error', summary:'Error', detail:'Error capturing face. Please try again.'});
      // alert('Error capturing face. Please try again.');
    } finally {
      this.loading = false;
    }
  }

  RegisterFace() {
    this.registerfaceoption = true;
    this.startVideo();
  }
  async registerDevice() {
    this.deviceId = await this.authService.getDeviceId();
    
    if (this.deviceId) {
      this.authService.registerDevice({ deviceId: this.deviceId }).subscribe({
      // this.http.post('http://localhost:8000/api/register-device/', { deviceId: this.deviceId }).subscribe({
        next: (response) => {
          this.deviceRegistered = true;  // Mark device as registered
          alert('Device registered successfully!');
        },
        error: (error) => {
          alert(error.error.error || 'Device registration failed');
        }
      });
    }
  }
  onRegisterSubmit() {
    // this.deviceId = await this.authService.getDeviceId();
    if (!this.faceRegistered || !this.faceDescriptor) {

      alert('Face is not registered. Please register your face before submitting.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    const data = {
      studentId: this.firstFormGroup.value.studentId,
      name: this.firstFormGroup.value.name,
      email: this.firstFormGroup.value.email,
      password: this.firstFormGroup.value.password,
      branch: this.firstFormGroup.value.branch,
      year: this.firstFormGroup.value.year,
      semester: this.firstFormGroup.value.semester,
      phoneNumber: this.firstFormGroup.value.phoneNumber,
      phoneNumber1: this.firstFormGroup.value.phoneNumber1,
      academicYear: this.firstFormGroup.value.academicYear,
      isLateralEntry: this.firstFormGroup.value.isLateralEntry,
      faceDescriptor: this.faceDescriptor,
      deviceId: this.deviceId,
    };

    console.log("device id ",this.deviceId);
    this.authService.registerStudent(data).subscribe(
      (res) => {
        this.messageService.add({key:'toast1',  severity:'success', summary:'Success', detail:'Registration successful!'});
        alert('Registration successful!');
        this.clearForm();
        this.toggleForm();
      },
      (err) => {
        alert('Registration failed.');
      }
    );
  }

  onLoginSubmit() {
    const data = {
      studentIdOrEmail: this.loginStudentIdOrEmail,
      password: this.loginPassword,
      deviceId: this.deviceId,
    };

    this.authService.loginStudent(data).subscribe(
      (res) => {
        this.messageService.add({key:'toast1', severity:'success', summary:'Success', detail:'Login successful!'});

        this.clearForm();
        setTimeout(() => {
          this.router.navigate(['/student/dashboard']);
        }, 1000);
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
    this.firstFormGroup.reset();
    this.thirdFormGroup.reset();
    this.loginStudentIdOrEmail = '';
    this.loginPassword = '';
    this.faceDescriptor = null;
    this.faceRegistered = false;
  }

  onLateralEntryChange() {
    this.isLateralEntry = !this.isLateralEntry;
    this.firstFormGroup.patchValue({ isLateralEntry: this.isLateralEntry });
    // console.log('Lateral Entry:', this.isLateralEntry);

    const message = this.isLateralEntry 
      ? 'You are registering as a Lateral Entry student. You will join the original batch and complete 3 years.' 
      : 'You are registering as a regular 4-year student.';
    
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  togglePasswordVisibility() {
    this.hide = !this.hide;
  }


}
