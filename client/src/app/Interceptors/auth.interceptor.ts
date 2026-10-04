import { HttpContext, HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Injector, inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../Services/auth.service';

const SKIP_AUTH = new HttpContextToken<boolean>(() => false);
const AUTH_RETRY = new HttpContextToken<boolean>(() => false);

/** Marca una petición para que el interceptor no añada el token ni intente renovar. */
export function skipAuth(): HttpContext {
  return new HttpContext().set(SKIP_AUTH, true);
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(Injector);
  const authService = injector.get(AuthService);
  const token = authService.getToken();

  const isApiRequest = req.url.includes('/api/');
  const skip = req.context.get(SKIP_AUTH) || req.context.get(AUTH_RETRY);

  if (!isApiRequest || skip || !token) {
    return next(req);
  }

  const clonedReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(clonedReq).pipe(
    catchError((error: unknown) => {
      const isUnauthorized = error instanceof HttpErrorResponse && error.status === 401;

      // Ante un 401 se renueva el access token y se reintenta una sola vez.
      if (!isUnauthorized) {
        return throwError(() => error);
      }

      return authService.refresh().pipe(
        switchMap((tokens) => {
          authService.saveSession(tokens);

          return next(
            req.clone({
              context: req.context.set(AUTH_RETRY, true),
              setHeaders: { Authorization: `Bearer ${tokens.accessToken}` }
            })
          );
        }),
        catchError((refreshError: unknown) => {
          authService.logout();
          return throwError(() => refreshError);
        })
      );
    })
  );
};
