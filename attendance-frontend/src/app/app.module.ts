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
import { CrcModule } from './features/crc/crc.module';
// Import any other necessary modules, e.g., for routing, forms, etc.
import { routes } from './app.routes';

@NgModule({
    declarations: [
        AppComponent,
        TestComponent,
                  // Add HomeComponent to Shared components
    ],
    imports: [
        BrowserModule,
        RouterOutlet,
        FormsModule,
        CommonModule,
        RouterModule.forRoot(routes),  // Define routes
        CoreModule,
        ComponentsModule,
    ],
    providers: [
        provideHttpClient(withInterceptorsFromDi())  // HTTP client setup
    ],
    bootstrap: [AppComponent],
    exports: [RouterModule],
})
export class AppModule { }
