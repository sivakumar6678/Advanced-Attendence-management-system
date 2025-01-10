import { NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';
import { AttendanceService } from './services/attendance.service';
import { authGuard } from './guards/auth.guard'; // Corrected import
import { roleGuard } from './guards/role.guard'; // Corrected import
import { authInterceptor } from './interceptors/auth.interceptor'; // Corrected import

@NgModule({
  providers: [
    AuthService,
    UserService,
    AttendanceService,
    {
      provide: HTTP_INTERCEPTORS,
      useValue: authInterceptor, // Use camelCase here
      multi: true,
    },
  ],
})
export class CoreModule {}
