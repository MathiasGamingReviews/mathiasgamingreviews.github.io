/**
 * @file Application-wide providers.
 */

import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { TitleStrategy, provideRouter, withComponentInputBinding } from '@angular/router';
import { SiteTitleStrategy } from './core/page-title';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Route and query parameters are bound to page inputs of the same name (e.g. :slug -> slug()).
    provideRouter(routes, withComponentInputBinding()),
    { provide: TitleStrategy, useClass: SiteTitleStrategy },
  ],
};
