import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfirmationService } from 'primeng/api'; // Assuming you're using PrimeNG for confirmation dialogs
import { MessageService } from 'primeng/api'; // Assuming you're using PrimeNG for messages
import { AuthService } from '../../core/services/auth.service';
@Component({
  selector: 'app-superadmin',
  templateUrl: './superadmin.component.html',
  styleUrls: ['./superadmin.component.css']
})
export class SuperadminComponent implements OnInit {
  isLoggedIn = false;
  email = '';
  password = '';
  facultyList: any[] = [];
  newFaculty = { name: '', email: '', employee_id: '' };
  errorMessage = '';
  activeSection: 'add' | 'view' = 'add';

  branch = { name: '', head_of_department: '', description: '' };
  year = { start_year: null, end_year: null };

  branches: any[] = [];
  academicYears: any[] = [];

  selectedBranch: any = null;
  editBranchDialog: boolean = false;

  selectedYear: any = null;
  editYearDialog: boolean = false;

  showFacultySection = false;
  showBranchSection = false;
  showYearSection = false;

  constructor(private http: HttpClient,
              private authService: AuthService, // Assuming AuthService is imported from your core services
              private messageService: MessageService, // Assuming MessageService is imported from 'primeng/api'
              private confirmationService: ConfirmationService // Assuming ConfirmationService is imported from 'primeng/api'
  ) {}

  ngOnInit(): void {
    if (localStorage.getItem('superadmin')) {
      this.isLoggedIn = true;
      this.getFacultyList();
    }
    this.getBranches();
  this.getAcademicYears();
  }

  toggleSection() {
    this.activeSection = this.activeSection === 'add' ? 'view' : 'add';
  }

  login() {
    this.authService.loginSuperAdmin(this.email, this.password).subscribe(
      (res) => {
        this.isLoggedIn = true;
        localStorage.setItem('superadmin', this.email);
        this.getFacultyList();
      },
      (err) => {
        this.errorMessage = err.error.error || 'Login failed';
      }
    );
    
  }

  getFacultyList() {
    this.authService.getFacultyList().subscribe(
        (res: any) => {
          this.facultyList = res;
        },
        err => {
          this.errorMessage = 'Failed to load faculty list';
        }
      );
  }

  addFaculty() {
    this.authService.addFaculty(this.newFaculty).subscribe(
        res => {
          this.getFacultyList();
          this.newFaculty = { name: '', email: '', employee_id: '' };
          this.activeSection = 'view'; // Switch to view section after adding
        },
        err => {
          this.errorMessage = err.error.error || 'Failed to add faculty';
        }
      );
  }

  logout() {
    this.isLoggedIn = false;
    localStorage.removeItem('superadmin');
  }

  addBranch() {
    this.authService.addBranch(this.branch).subscribe({      next: () => {
        this.messageService.add({key:'main-toast', severity: 'success', summary: 'Success', detail: 'Branch added' });
        this.branch = { name: '', head_of_department: '', description: '' };
      },
      error: err => console.error(err)
    });
  }
  
  addAcademicYear() {
    this.authService.addAcademicYear(this.year).subscribe({
     next: () => {
        this.messageService.add({ key:'main-toast', severity: 'success', summary: 'Success', detail: 'Academic Year added' });
        this.year = { start_year: null, end_year: null };
      },
      error: err => console.error(err)
    });
  }

  getBranches() {
    this.authService.getBranches().subscribe({
    next: (res: any) => {
        this.branches = res;
      },
      error: (err: any) => {
        console.error(err);
        this.messageService.add({ key: 'main-toast', severity: 'error', summary: 'Error', detail: 'Failed to load branches' });
      }
    });
  }

  getAcademicYears() {
    this.authService.getAcademicYears().subscribe({
      next: (res: any) => {
        this.academicYears = res;

      },
      error: (err: any) => {
        console.error(err);
        this.messageService.add({ key: 'main-toast', severity: 'error', summary: 'Error', detail: 'Failed to load academic years' });
      }
    });
  }

  openEditBranch(branch: any) {
    this.selectedBranch = { ...branch };
    this.editBranchDialog = true;
  }
  
  updateBranch() {
    this.authService.updateBranch(this.selectedBranch.id, this.selectedBranch).subscribe({
      next: () => {
        this.getBranches();
        this.editBranchDialog = false;
        this.selectedBranch = null;
        this.messageService.add({ key: 'main-toast', severity: 'success', summary: 'Success', detail: 'Branch updated' });
      },
      error: err => console.error('Update failed', err)
    });
  }
  
  confirmDeleteBranch(branch: any) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${branch.name}?`,
      accept: () => this.deleteBranch(branch.id)
    });
  }
  
  deleteBranch(branchId: number) {
    this.authService.deleteBranch(branchId).subscribe({
      next: () => {
        this.getBranches();
        this.messageService.add({ key: 'main-toast', severity: 'success', summary: 'Success', detail: 'Branch deleted' });
      },

      error: err => { 
        console.error('Delete failed', err);
        this.messageService.add({ key: 'main-toast', severity: 'error', summary: 'Error', detail: 'Failed to delete branch' });
       }
    });
  }

  loadAcademicYears() {
    this.authService.getAcademicYears().subscribe((res: any) => {
      this.academicYears = res;
    });
  }

openEditYear(year: any) {
  this.selectedYear = { ...year };
  this.editYearDialog = true;
}

updateAcademicYear() {
  if (!this.selectedYear?.id) return;
  this.authService.updateAcademicYear(this.selectedYear.id, this.selectedYear).subscribe(() => {    this.messageService.add({key:'main-toast', severity: 'success', summary: 'Updated', detail: 'Academic Year updated' });
    this.editYearDialog = false;
    this.loadAcademicYears();
  });
}

confirmDeleteYear(year: any) {
  this.confirmationService.confirm({
    message: `Are you sure you want to delete year ${year.start_year}-${year.end_year}?`,
    header: 'Confirm Delete',
    icon: 'pi pi-exclamation-triangle',
    accept: () => {
      this.http.delete(`http://127.0.0.1:8000/api/core/academic-years/${year.id}/`).subscribe(() => {
        this.messageService.add({ key:'main-toast', severity: 'success', summary: 'Deleted', detail: 'Academic Year deleted' });
        this.loadAcademicYears();
      });
    }
  });
}




}