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


import { ButtonModule } from "primeng/button";
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { StepperModule } from 'primeng/stepper';
import { PasswordModule } from 'primeng/password';
import { DropdownModule } from 'primeng/dropdown';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { CheckboxModule } from 'primeng/checkbox';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToolbarModule } from 'primeng/toolbar';
import { FieldsetModule } from 'primeng/fieldset';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';

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

        // PrimeNG Modules
        ButtonModule,
        InputGroupModule,
        InputGroupAddonModule,
        InputTextModule,
        FloatLabelModule,
        StepperModule,
        PasswordModule,
        DropdownModule,
        IconFieldModule,
        InputIconModule,
        CheckboxModule,
        ProgressSpinnerModule,
        ToolbarModule,
        FieldsetModule,
        ToastModule,
        CardModule,
        MessageModule

      

        
    ],
    providers: [
        MessageService,
        provideHttpClient(withInterceptorsFromDi())  // HTTP client setup
    ],
    bootstrap: [AppComponent],
    exports: [RouterModule],

})
export class AppModule { }