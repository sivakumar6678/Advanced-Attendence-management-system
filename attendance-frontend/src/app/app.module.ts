import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';



@NgModule({
    declarations: [
        AppComponent,
        HomeComponent,
        StudentAuthComponent,
        TestComponent
    ],
    imports: [
        RouterModule.forRoot(routes),  // Define routes
        BrowserModule,
        RouterOutlet,
        FormsModule,
        CommonModule,

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
    ],
    providers: [
        provideHttpClient(withInterceptorsFromDi())  // HTTP client setup
    ],
    bootstrap: [AppComponent],
    exports: [RouterModule],

})
export class AppModule { }