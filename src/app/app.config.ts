import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

import { routes } from './app.routes';

// Importar servicios
import { AuthService } from './core/services/auth.service';
import { ApiService } from './core/services/api.service';
import { HotelService } from './core/services/hotel.service';
import { AuthGuard } from './core/guards/auth.guard';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),

    // Módulos
    importProvidersFrom(
      BrowserAnimationsModule,
      HttpClientModule,
      ReactiveFormsModule
    ),

    // Servicios (ya están en 'root' pero los registramos explícitamente)
    AuthService,
    ApiService,
    HotelService,
    AuthGuard,
  ],
};
