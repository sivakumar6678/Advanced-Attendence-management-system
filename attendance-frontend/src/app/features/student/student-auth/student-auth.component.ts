import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import * as faceapi from 'face-api.js';
import * as tf from '@tensorflow/tfjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { UserService } from '../../../core/services/user.service';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { LoadingService } from '../../../core/services/loading.service';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { isPlatformBrowser } from '@angular/common';
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

  deviceId: string | null = null;
  deviceName: string = '';
  deviceType: string = '';
  platform: string = '';
  browser: string = '';
  osVersion: string = '';
  screenResolution: string = '';
  ipAddress: string = '';
  

  deviceRegistered: boolean = false;  // To track device registration
  deviceInfo: string = '';
  isDeviceMobile: boolean = true;
  deviceDetailsFetched: boolean = false;
  isSupportedDevice: boolean = false;
  registrationError: string = '';

  forgotDeviceDialogVisible: boolean = false;
  emailForReRegistration: string = '';
  otpSent: boolean = false;
  enteredOtp: string = '';
  otp: string = ''; // We'll get this from the backend
  message: string = '';
  isOtpSent: boolean = false;
  otpVerified: boolean = false;

  
  constructor(private authService: AuthService,
              private userService: UserService,
              private router: Router,
              private messageService:MessageService,
              private _formBuilder: FormBuilder,
              private loadingService: LoadingService
            ) {
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
      // deviceId: ['', Validators.required],
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
      isLateralEntry: [this.isLateralEntry]
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
    this.loadingService.show();
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
        
        this.messageService
        .add({key:'main-toast', severity:'success', summary:'Success', detail:'Face captured successfully!'});
        this.registerfaceoption = false;
        this.stopVideo();
      } else {
        this.messageService.add({key:'main-toast', severity:'error', summary:'Error', detail:'Error capturing face. Please try again.'});
        
      }
    } catch (error) {
      console.error('Error capturing face:', error);
      this.messageService.add({key:'main-toast', severity:'error', summary:'Error', detail:'Error capturing face. Please try again.'});
      // alert('Error capturing face. Please try again.');
    } finally {
      setTimeout(() => {
      this.loadingService.hide();
      }, 2000);
      this.loading = false;
    }
  }

  RegisterFace() {
    this.registerfaceoption = true;
    this.startVideo();
  }
  async fetchDeviceDetails() {
    try {
        this.deviceId = await this.authService.getDeviceId();
        this.deviceName = await this.authService.getDeviceName();
        this.deviceType = await this.authService.getDeviceType();
        this.platform = await this.authService.getPlatform();
        this.browser = await this.authService.getBrowserInfo();
        this.osVersion = await this.authService.getOSVersion();
        this.screenResolution = `${window.screen.width}x${window.screen.height}`;
        this.ipAddress = await this.authService.getIpAddress();

        this.deviceDetailsFetched = true;
        this.registrationError = ''; // Reset error message

    } catch (error) {
        console.error('Error fetching device details:', error);
        this.messageService.add({ key: 'main-toast', severity: 'error', summary: 'Error', detail: 'Failed to fetch device details' });
    }
}


confirmRegistration() {
  // ✅ Step 1: Ensure device details are fetched
  if (!this.deviceDetailsFetched) {
      this.messageService.add({ key: 'main-toast', severity: 'error', summary: 'Error', detail: 'Please fetch device details first.' });
      return;
  }

  // ✅ Step 2: Validate device details (Modify conditions as needed)
  const allowedPlatforms = ["Windows", "Android", "iOS", "Linux x86_64"];
  const allowedBrowsers = ["Chrome", "Firefox", "Safari"];

  if (!this.deviceId || !this.deviceName || !this.platform || !this.browser || !this.osVersion) {
      this.messageService.add({ key: 'main-toast', severity: 'error', summary: 'Error', detail: 'Incomplete device details. Please try again.' });
      return;
  }

  if (!allowedPlatforms.includes(this.platform)) {
      this.messageService.add({ key: 'main-toast', severity: 'error', summary: 'Error', detail: `Unsupported platform: ${this.platform}.` });
      return;
  }

  if (!allowedBrowsers.includes(this.browser)) {
      this.messageService.add({ key: 'main-toast', severity: 'error', summary: 'Error', detail: `Unsupported browser: ${this.browser}.` });
      return;
  }

  // ✅ Step 3: If everything is valid, allow moving to the next step
  this.deviceRegistered = true;
  this.messageService.add({ key: 'main-toast', severity: 'success', summary: 'Success', detail: 'Device is valid. You can proceed.' });

  // ✅ Move to the next step (update stepper index)
  this.active! += 1;
}

onRegisterSubmit() {
  if (!this.faceRegistered || !this.faceDescriptor) {
    this.messageService.add({key:'main-toast', severity:'error', summary:'Error', detail:'Face is not registered. Please register your face before submitting.'});
    return;
  }

  if (this.password !== this.confirmPassword) {
    this.messageService.add({key:'main-toast', severity:'error', summary:'Error', detail:'Passwords do not match!'});
    return;
  }

  // ✅ Include device details in student registration
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

    // ✅ Add device details
    deviceId: this.deviceId,
    deviceName: this.deviceName,
    deviceType: this.deviceType,
    platform: this.platform,
    browser: this.browser,
    osVersion: this.osVersion,
    screenResolution: this.screenResolution,
    ipAddress: this.ipAddress,
  };

  this.authService.registerStudent(data).subscribe(
    (res) => {
      this.messageService.add({key:'main-toast',  severity:'success', summary:'Success', detail:'Registration successful!'});
      this.clearForm();
      setTimeout(() => {
        this.toggleForm();
      }, 1000);
    },
    (err) => {
      this.messageService.add({key:'main-toast', severity:'error', summary:'Error', detail:'Registration failed. Please try again.'});
    }
  );
}


  async onLoginSubmit() {
    this.deviceId = await this.authService.getDeviceId(); // ✅ Ensure deviceId is freshly fetched
    const data = {
      studentIdOrEmail: this.loginStudentIdOrEmail,
      password: this.loginPassword,
      deviceId: this.deviceId,
    };
    console.log("device id",this.deviceId);

    this.authService.loginStudent(data).subscribe(
      (res) => {
        this.messageService.add({key:'main-toast', severity:'success', summary:'Success', detail:'Login successful!'});
        console.log("Login successful!'",res);
        localStorage.setItem('access_token', res.access_token);
        localStorage.setItem('refresh_token', res.refresh_token);

        this.clearForm();
        setTimeout(() => {
          this.router.navigate(['/student/dashboard']);
        }, 1000);
      },
      (err) => {
        this.messageService.add({key:'main-toast', severity:'error' , summary:'Login Failed' , detail:'Error details ' })
        // alert('Login failed.');
        
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
  toggleLateralEntry(): void {
    this.isLateralEntry = !this.isLateralEntry;
    this.firstFormGroup.patchValue({ isLateralEntry: this.isLateralEntry });
    const message = this.isLateralEntry 
      ? 'You are registering as a Lateral Entry student. You will join the original batch and complete 3 years.' 
      : 'You are registering as a regular 4-year student.';
    
    this.messageService.add({key:'main-toast', severity:'info', summary:'Info', detail:message});
  }

  togglePasswordVisibility() {
    this.hide = !this.hide;
  }

  openForgotDeviceDialog() {
    this.forgotDeviceDialogVisible = true;
  }

  sendOtpToEmail() {
    if (this.emailForReRegistration) {
      // Call the AuthService to send OTP
      this.authService.sendOtpToEmail(this.emailForReRegistration).subscribe(
        response => {
          // Handle the response (OTP sent successfully)
          if (response.status === 'success') {
            this.otpSent = true;
            this.messageService.add({ key: 'main-toast', severity: 'info', summary: 'OTP Sent', detail: 'OTP has been sent to your email.' });
          }
        },
        error => {
          // Handle error (e.g., email not found, server issues)
          this.messageService.add({ key: 'main-toast', severity: 'error', summary: 'Error', detail: 'Failed to send OTP. Please try again.' });
        }
      );
    } else {
      this.messageService.add({ key: 'main-toast', severity: 'error', summary: 'Error', detail: 'Please enter a valid email.' });
    }
  }
  
  

  // Verify OTP entered by the user
  verifyOtp() {
    if (this.emailForReRegistration && this.enteredOtp) {
      this.authService.verifyOtp(this.emailForReRegistration, this.enteredOtp).subscribe(
        response => {
          if (response.status === 'success') {
            this.messageService.add({ key: 'main-toast', severity: 'success', summary: 'Success', detail: 'Device re-registered.' });
            this.forgotDeviceDialogVisible = false;
            this.otpVerified = true; // ✅ show device registration step
          } else {
            this.messageService.add({ key: 'main-toast', severity: 'error', summary: 'Error', detail: response.message });
          }
        },
        error => {
          this.messageService.add({ key: 'main-toast', severity: 'error', summary: 'Error', detail: 'OTP verification failed. Please try again.' });
        }
      );
    } else {
      this.messageService.add({ key: 'main-toast', severity: 'warn', summary: 'Input Required', detail: 'Please enter your OTP.' });
    }
  }
  

  // Proceed with device re-registration after OTP verification
  reRegisterDevice() {
    // Call the AuthService to verify OTP
    this.authService.verifyOtp(this.emailForReRegistration, this.enteredOtp).subscribe(
      response => {
        // Handle successful re-registration
        if (response.status === 'success') {
          this.messageService.add({ key: 'main-toast', severity: 'success', summary: 'Device Registered', detail: 'Your device has been successfully registered.' });
          this.forgotDeviceDialogVisible = false;
        }
      },
      error => {
        // Handle error (invalid OTP, server issues)
        this.messageService.add({ key: 'main-toast', severity: 'error', summary: 'Error', detail: 'Device re-registration failed. Please try again.' });
      }
    );
  }

  

  confirmdeviceReRegistration() {
    const data = {
      email: this.emailForReRegistration,
      reason: "Lost phone, need to re-register new device",
      device_info: {
        device_id: this.deviceId,
        device_name: this.deviceName,
        device_type: this.deviceType,
        platform: this.platform,
        browser: this.browser,
        os_version: this.osVersion,
        screen_resolution: this.screenResolution,
        ip_address: this.ipAddress,
      }
    };
  
    this.authService.sendDeviceRequest(data).subscribe(
      (res) => {
        console.log('Device request sent successfully:', res);
        this.messageService.add({ key: 'main-toast', severity: 'success', summary: 'Success', detail: 'Device request sent successfully!' });
        this.deviceRegistered = true;
        setTimeout(() => {
          this.toggleForm();
          this.otpVerified = false; // Reset OTP verification status
          this.forgotDeviceDialogVisible = false; // Close the dialog
        }, 1000);
      },
      (err) => {
        console.error('Error sending device request:', err);
        this.messageService.add({ key: 'main-toast', severity: 'error', summary: 'Error', detail: 'Failed to send device request. Please try again.' });
      }
    );
  }
  

}
