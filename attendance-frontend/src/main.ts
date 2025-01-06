import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';  // Import platformBrowserDynamic
import { AppModule } from './app/app.module';  // Import AppModule

platformBrowserDynamic()  // Use platformBrowserDynamic to bootstrap AppModule
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));
