import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { MessageService } from 'primeng/api';


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



  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private messageService: MessageService
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
  }



  onLogin() {
    if (this.loginForm.invalid) return;

    const { email, password } = this.loginForm.value;
    this.authService.login(email, password).subscribe(
      response => {
        this.messageService.add({ key:'toast-anime', severity: 'success', summary: 'Login successful!', detail: 'Welcome back!' });
        this.loginForm.reset();
        console.log('Login successful:', response);
      },
      error => {
        if (error.status === 401) {
          this.messageService.add({ key:'main-toast', severity: 'error', summary: 'Invalid email or password!', detail: 'Please check your credentials and try again.' });
        } else {
          this.messageService.add({ key:'main-toast', severity: 'error', summary: 'Login failed!', detail: 'Something went wrong. Please try again.' });
        }
      }
    );
  }

  onRegister() {
    if (this.registerForm.invalid) return;

    this.authService.register(this.registerForm.value).subscribe(
      response => {
        this.messageService.add({ key:'toast-anime', severity: 'success', summary: 'Registration successful!', detail: 'Please log in.' });
        this.registerForm.reset();
        this.switchMode(); // Switch to login mode after registration
      },
      error => {
        if (error.status === 400) {
          this.messageService.add({ key:'main-toast', severity: 'error', summary: 'Email already registered!', detail: 'Please use a different email.' });
        } else {
          this.messageService.add({ key:'main-toast', severity: 'error', summary: 'Registration failed!', detail: 'Please try again.' });
        }
      }
    );
  }
}
