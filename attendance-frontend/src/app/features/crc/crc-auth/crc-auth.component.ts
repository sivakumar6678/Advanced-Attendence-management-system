import { Component } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';

@Component({
  selector: 'app-crc-auth',
  templateUrl: './crc-auth.component.html',
  styleUrls: ['./crc-auth.component.css']
})
export class CrcAuthComponent {
  email = '';
  employeeId = '';
  facultyDetails: any = null;
  registrationData: any = {
    branch: null,
    year: '',
    semester: '',
    password: '',
    academicYear:''
  };
  loginData: any = {
    email: '',
    password: ''
  };
  branchOptions: any[] = [];
  yearOptions = [1, 2, 3, 4];
  semesterOptions = [1, 2];
  academicYearOptions: any[] = [];

  constructor(private crcAuthService: AuthService,
              private userService: UserService,
              private messageservice: MessageService,
              private router: Router
            ) {}

  ngOnInit() {
    this.userService.getBranches().subscribe((data: any) => {
      this.branchOptions = data;
      console.log('Branches:', this.branchOptions);
  
      if (this.facultyDetails?.branch) {
        this.setBranchSelection();
      }
    });
  
    this.userService.getAcademicYears().subscribe((data: any) => {
      this.academicYearOptions = data.map((year: any) => ({
        label: `${year.start_year}-${year.end_year}`,  // Display as "2024-2025"
        value: year.id  // Store the ID instead of string
      }));
      console.log('Academic years:', this.academicYearOptions);
    });
            }
            

  // Fetch Faculty Details
  fetchFacultyDetails() {
    if (this.email && this.employeeId) {
      this.crcAuthService.fetchFacultyDetails(this.email, this.employeeId).subscribe(
        (res) => {
          this.facultyDetails = res; // Autofill details if faculty is found
          console.log('Fetched Faculty:', this.facultyDetails);
          this.messageservice.add({key: 'toast-anime',severity:'success', summary:'Faculty Found', detail:'Faculty details fetched successfully!'});

          // Try setting the correct branch
          this.setBranchSelection();
        },
        (error) => {
          console.error('Faculty not found', error);
          this.messageservice.add({key: 'toast-anime',severity:'error', summary:'Faculty Not Found', detail:'Faculty not found. Please check the email and employee ID.'});
          this.facultyDetails = null; // Reset if no faculty found
        }
      );
    }
  }

  // Match faculty branch ID with branchOptions
  setBranchSelection() {
    if (this.facultyDetails?.branch && this.branchOptions.length > 0) {
      const matchedBranch = this.branchOptions.find(branch => branch.id == this.facultyDetails.branch);
      if (matchedBranch) {
        this.registrationData.branch = matchedBranch.id; // Auto-select branch
        console.log('Auto-selected Branch:', this.registrationData.branch);
      }
    }
  }

  registerCRC() {
    if (this.registrationData.year && this.registrationData.semester && this.registrationData.password) {
      const crcData = {
        email: this.email,
        employee_id: this.employeeId,
        branch: this.registrationData.branch,
        year: this.registrationData.year,
        semester: this.registrationData.semester,
        password: this.registrationData.password,
        academic_year_id: this.registrationData.academicYear // ✅ Send ID, not string
      };
  
      this.crcAuthService.registerCRC(crcData).subscribe(
        (res) => {
          console.log('CRC Registered Successfully!', res);
          this.messageservice.add({ key: 'toast-anime', severity: 'success', summary: 'CRC Registered', detail: 'CRC registered successfully!' });
          this.clearForm();
        },
        (error) => {
          console.error('Error registering CRC', error);
          this.messageservice.add({ key: 'toast-anime', severity: 'error', summary: 'CRC Registration Failed', detail: 'CRC registration failed. Please try again.' });
        }
      );
    }
  }
  
  

  // Login CRC
  loginCRC() {
    if (this.loginData.email && this.loginData.password) {
      this.crcAuthService.loginCRC(this.loginData).subscribe(
        (res) => {
          console.log('Login Successful!', res);
          localStorage.setItem('access_token', res.access_token);
          localStorage.setItem('refresh_token', res.refresh_token);
          this.messageservice.add({key: 'toast-anime',severity:'success', summary:'Login Successful', detail:'Logged in successfully!'});
          this.clearForm();
          this.router.navigate(['/crc/dashboard']);

        },
        (error) => {
          console.error('Error logging in', error);
          this.messageservice.add({key: 'toast-anime',severity:'error', summary:'Login Failed', detail:'Login failed. Please check your credentials.'});
        }
      );
    }
  }

  clearForm() {
    this.email = '';
    this.employeeId = '';
    this.facultyDetails = null;
    this.registrationData = {
      branch: null,
      year: '',
      semester: '',
      password: ''
    };
    this.loginData = {
      email: '',
      password: ''
    };
  }


}
