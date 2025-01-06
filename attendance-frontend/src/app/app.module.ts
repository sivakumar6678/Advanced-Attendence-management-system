import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TestComponent } from './test/test.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import {routes} from './app.routes';
import { RouterModule } from '@angular/router';
@NgModule({
    declarations: [
        AppComponent,
    ],
    imports: [
        BrowserModule,
        RouterOutlet,
        FormsModule,
        CommonModule,
        RouterModule.forRoot(routes)
    ],
    providers: [
        provideHttpClient(withInterceptorsFromDi()),  // Add the new way to configure HttpClient
      ],
    bootstrap: [AppComponent],
    exports: [RouterModule],
})
export class AppModule { }