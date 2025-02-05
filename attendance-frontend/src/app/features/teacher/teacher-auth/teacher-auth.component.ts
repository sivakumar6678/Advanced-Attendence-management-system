import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-teacher-auth',
  templateUrl: './teacher-auth.component.html',
  styleUrls: ['./teacher-auth.component.css']
})
export class TeacherAuthComponent implements OnInit {
  isLoginMode = true;
  loginForm: FormGroup;
  registerForm: FormGroup;
  branchOptions: any[] = [];

  alertMessage: string = '';
  alertType: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService
  ) {
    // Initialize Login Form
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Initialize Registration Form
    this.registerForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      branch: ['', Validators.required],
      phoneNumber: [''],
      password: ['', [Validators.required, Validators.minLength(6)]],
      employeeId: ['', Validators.required],
      joinedDate: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.userService.getBranches().subscribe((data: any) => {
      this.branchOptions = data;
    });
  }

  switchMode() {
    this.isLoginMode = !this.isLoginMode;
    this.clearAlert();
  }

  showAlert(message: string, type: string) {
    this.alertMessage = message;
    this.alertType = type;
    setTimeout(() => this.clearAlert(), 3000); // Alert disappears after 3 seconds
  }

  clearAlert() {
    this.alertMessage = '';
    this.alertType = '';
  }

  onLogin() {
    if (this.loginForm.invalid) return;

    const { email, password } = this.loginForm.value;
    this.authService.login(email, password).subscribe(
      response => {
        this.showAlert('Login successful!', 'success');
        this.loginForm.reset();
      },
      error => {
        if (error.status === 401) {
          this.showAlert('Invalid email or password!', 'error');
        } else {
          this.showAlert('Login failed! Try again.', 'error');
        }
      }
    );
  }

  onRegister() {
    if (this.registerForm.invalid) return;

    this.authService.register(this.registerForm.value).subscribe(
      response => {
        this.showAlert('Registration successful! Please log in.', 'success');
        this.registerForm.reset();
        this.switchMode(); // Switch to login mode after registration
      },
      error => {
        if (error.status === 400) {
          this.showAlert('Faculty already registered!', 'error');
        } else {
          this.showAlert('Registration failed! Try again.', 'error');
        }
      }
    );
  }
}
