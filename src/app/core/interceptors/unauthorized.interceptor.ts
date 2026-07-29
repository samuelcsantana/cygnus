import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../../features/auth/data-access/auth.service';

export const unauthorizedInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      const isSessionExpired =
        error instanceof HttpErrorResponse && error.status === 401 && !req.url.includes('/auth/login');

      if (isSessionExpired) {
        authService.clearSession();
        router.navigateByUrl('/auth/login');
      }

      return throwError(() => error);
    }),
  );
};
