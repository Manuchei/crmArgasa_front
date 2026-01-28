import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { provideNativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';

import { empresaInterceptor } from './interceptors/empresa.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),

    // ✅ único HttpClient (aquí) con interceptor
    provideHttpClient(withInterceptors([empresaInterceptor])),

    importProvidersFrom(BrowserModule),
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
  ],
};
