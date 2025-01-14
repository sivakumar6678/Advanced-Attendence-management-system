import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TestComponent } from './test/test.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { RouterModule } from '@angular/router';
// Import your components for login and registration
import { StudentAuthComponent } from './features/student/student-auth/student-auth.component';
import { TeacherAuthComponent } from './features/teacher/teacher-auth/teacher-auth.component';
import { CrcAuthComponent } from './features/crc/crc-auth/crc-auth.component';
import { CoreModule } from './core/core.module';
import { ComponentsModule } from './shared/components.module';
import { routes } from './app.routes';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';

import { HomeComponent } from './shared/components/home/home.component';

@NgModule({
    declarations: [
        AppComponent,
        TestComponent,
        HomeComponent,
    ],
    imports: [
        BrowserModule,
        RouterOutlet,
        FormsModule,
        CommonModule,
        RouterModule.forRoot(routes),  // Define routes
        CoreModule,
        ComponentsModule,
        BrowserAnimationsModule,
        MatToolbarModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatGridListModule,
        MatSidenavModule,
        MatListModule
    ],
    providers: [
        provideHttpClient(withInterceptorsFromDi())  // HTTP client setup
    ],
    bootstrap: [AppComponent],
    exports: [RouterModule],
})
export class AppModule { }
