import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { API_URL } from './Api.Service';

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
}

export interface TokenResponse {
  tokenType: string;
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  user: UserSession;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const ADMINISTRATOR_ROLE = 'Administrador';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly tokenKey = 'firmeza_accessToken';
  private readonly refreshTokenKey = 'firmeza_refreshToken';
  private readonly userKey = 'firmeza_user';

  // Reactividad moderna con Angular Signals
  readonly currentUser = signal<UserSession | null>(this.getStoredUser());
  readonly isAuthenticatedSignal = computed(() => !!this.currentUser() && !!this.getToken());

  register(userData: RegisterRequest): Observable<UserSession> {
    return this.http.post<UserSession>(`${API_URL}/auth/register`, userData);
  }

  login(credentials: LoginRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${API_URL}/auth/login`, credentials);
  }

  refresh(): Observable<TokenResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No hay refresh token almacenado.'));
    }

    return this.http.post<TokenResponse>(`${API_URL}/auth/refresh`, { refreshToken });
  }

  me(): Observable<UserSession> {
    return this.http.get<UserSession>(`${API_URL}/auth/me`);
  }

  saveSession(tokens: TokenResponse): void {
    localStorage.setItem(this.tokenKey, tokens.accessToken);
    localStorage.setItem(this.refreshTokenKey, tokens.refreshToken);
    localStorage.setItem(this.userKey, JSON.stringify(tokens.user));
    this.currentUser.set(tokens.user);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  getUser(): UserSession | null {
    return this.currentUser();
  }

  isAdministrator(): boolean {
    return !!this.currentUser()?.roles.includes(ADMINISTRATOR_ROLE);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // Validación básica de expiración del JWT en cliente
    try {
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) return false;

      const decodedJson = JSON.parse(atob(payloadBase64));
      if (decodedJson.exp && decodedJson.exp * 1000 < Date.now()) {
        return false;
      }

      return true;
    } catch {
      return true;
    }
  }

  logout(redirectToLogin = true): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUser.set(null);

    if (redirectToLogin) {
      this.router.navigate(['/login']);
    }
  }

  private getStoredUser(): UserSession | null {
    try {
      const stored = localStorage.getItem(this.userKey);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
}
