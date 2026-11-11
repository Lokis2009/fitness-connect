import type { HttpInterceptorFn } from '@angular/common/http';

/**
 * Adds `Authorization: Bearer <token>` to requests whose URL starts with
 * `/api/`. A 401 response to such a request while signed in ends the session
 * and navigates to `/login`.
 */
export const authInterceptor: HttpInterceptorFn = () => {
  throw new Error('not implemented');
};
