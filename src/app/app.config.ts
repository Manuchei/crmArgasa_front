import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import {
  provideNativeDateAdapter,
  MAT_DATE_LOCALE,
} from '@angular/material/core';

import { routes } from './app.routes';
import { empresaInterceptor } from './interceptors/empresa.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([empresaInterceptor])),

    // ✅ Necesario para que funcione MatDatepicker
    provideNativeDateAdapter(),

    // ✅ Opcional (pero recomendado): calendario y pipes en español
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
    { provide: LOCALE_ID, useValue: 'es-ES' },
  ],
};
