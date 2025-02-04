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
  isLoginMode = true; // Toggle between login & registration
  authForm!: FormGroup;
  branchOptions: any[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.loadForm();
    this.userService.getBranches().subscribe((data: any) => {
      this.branchOptions = data;
    });
  }

  loadForm() {
    if (this.isLoginMode) {
      // Login form
      this.authForm = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]]
      });
    } else {
      // Registration form
      this.authForm = this.fb.group({
        fullName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        branch: ['', Validators.required],
        phoneNumber: [''],
        password: ['', [Validators.required, Validators.minLength(6)]],
        employeeId: ['', Validators.required],
        joinedDate: ['', Validators.required]
      });
    }
  }

  switchMode() {
    this.isLoginMode = !this.isLoginMode;
    this.loadForm(); // Reload form based on mode
  }

  onSubmit() {
    if (this.authForm.invalid) return;

    if (this.isLoginMode) {
      // Login API
      const { email, password } = this.authForm.value;
      this.authService.login(email, password).subscribe(
        response => console.log('Login successful', response),
        error => console.log('Login failed', error)
      );
    } else {
      // Registration API
      this.authService.register(this.authForm.value).subscribe(
        response => console.log('Registration successful', response),
        error => console.log('Registration failed', error)
      );
    }
  }
}
