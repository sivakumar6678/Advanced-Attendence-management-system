import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { routes } from './app.routes';

import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { LoadingInterceptor } from './core/interceptors/loading.interceptor';

import { AppComponent } from './app.component';
import { TestComponent } from './test/test.component';

import { HomeComponent } from './shared/components/home/home.component';
import { LoadingComponent } from './shared/loading/loading.component';

import { SuperadminComponent } from './features/superadmin/superadmin.component';

import { StudentAuthComponent } from './features/student/student-auth/student-auth.component';
import { StudentDashboardComponent } from './features/student/student-dashboard/student-dashboard.component';

import { TeacherAuthComponent } from './features/teacher/teacher-auth/teacher-auth.component';

import { CrcAuthComponent } from './features/crc/crc-auth/crc-auth.component';
import { CrcDashboardComponent } from './features/crc/crc-dashboard/crc-dashboard.component';
import { CrcTimetableComponent } from './features/crc/crc-timetable/crc-timetable.component';


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
import { MenuItem } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';
import { TabViewModule } from 'primeng/tabview';
import { TableModule } from 'primeng/table';
import { BadgeModule } from 'primeng/badge';
import { AvatarModule } from 'primeng/avatar';
import {DialogModule} from 'primeng/dialog';
import { PanelModule } from 'primeng/panel';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';



@NgModule({
    declarations: [
        AppComponent,
        TestComponent,
        HomeComponent,
        LoadingComponent,
        
        SuperadminComponent,
        
        StudentAuthComponent,
        StudentDashboardComponent,
        
        TeacherAuthComponent,
        
        CrcAuthComponent,
        CrcDashboardComponent,
        CrcTimetableComponent,
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
        MessageModule,
        MenubarModule,
        TabViewModule,
        TableModule,
        BadgeModule,
        AvatarModule,
        DialogModule,
        PanelModule,
        TieredMenuModule,
        BreadcrumbModule,

      

        
    ],
    providers: [
        MessageService,
        provideHttpClient(withInterceptorsFromDi()),  // HTTP client setup
        { provide: HTTP_INTERCEPTORS, useClass: LoadingInterceptor, multi: true },  // Loading interceptor
    ],
    bootstrap: [AppComponent],
    exports: [RouterModule],

})
export class AppModule { }