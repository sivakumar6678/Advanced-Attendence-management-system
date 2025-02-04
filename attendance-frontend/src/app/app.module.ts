import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { routes } from './app.routes';

import { StudentAuthComponent } from './features/student/student-auth/student-auth.component';
import { TestComponent } from './test/test.component';
import { HomeComponent } from './shared/components/home/home.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {StepperOrientation, MatStepperModule} from '@angular/material/stepper';

import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CrcAuthComponent } from './features/crc/crc-auth/crc-auth.component';
import { TeacherAuthComponent } from './features/teacher/teacher-auth/teacher-auth.component';
import { SuperadminComponent } from './features/superadmin/superadmin.component';



@NgModule({
    declarations: [
        AppComponent,
        HomeComponent,
        StudentAuthComponent,
        TestComponent,
        TeacherAuthComponent,
        SuperadminComponent
    ],
    imports: [
        RouterModule.forRoot(routes),  // Define routes
        BrowserModule,
        RouterOutlet,
        FormsModule,
        CommonModule,
        ReactiveFormsModule,

        BrowserAnimationsModule,  // Animations

        // Material Modules 
        MatToolbarModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatGridListModule,
        MatSidenavModule,
        MatListModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatOptionModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,

        // snackbar
        MatSnackBarModule,
        MatStepperModule,

        
    ],
    providers: [
        provideHttpClient(withInterceptorsFromDi())  // HTTP client setup
    ],
    bootstrap: [AppComponent],
    exports: [RouterModule],

})
export class AppModule { }