import { HttpErrorResponse, type HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { API_BASE_URL } from '@fitness-connect/data-access';
import { AuthService } from './auth-service';

const DEV_LOGIN_SUFFIX = '/dev/login';

/**
 * Adds `Authorization: Bearer <token>` to requests to the API, that is whose URL is under
 * `API_BASE_URL` (default `/api/v1`). A 401 response to such a request while signed in means the session
 * has expired: it ends the session and navigates to `/login`. A 401 while
 * signed out (for example a failed session restore at startup) and a 401 from
 * the dev login (wrong credentials) are left to the caller.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const baseUrl = inject(API_BASE_URL).replace(/\/+$/, '');
  if (req.url !== baseUrl && !req.url.startsWith(`${baseUrl}/`)) {
    return next(req);
  }

  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.accessToken();
  const authorized = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authorized).pipe(
    catchError((error: unknown) => {
      const unauthorized =
        error instanceof HttpErrorResponse && error.status === HttpStatusCode.Unauthorized;

      if (unauthorized && auth.isAuthenticated() && !req.url.endsWith(DEV_LOGIN_SUFFIX)) {
        const returnUrl = router.url;
        auth.signOut();
        void router.navigate(['/login'], { queryParams: { returnUrl } });
      }
      return throwError(() => error);
    }),
  );
};
