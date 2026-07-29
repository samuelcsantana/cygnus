import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AuthActionResponse, LoginPayload, RegisterPayload, RegisteredUser } from './models/auth.models';

export interface AuthSession {
  email: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private readonly session = signal<AuthSession | null>(null);

  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly currentSession = this.session.asReadonly();

  register(payload: RegisterPayload): Observable<RegisteredUser> {
    return this.http.post<RegisteredUser>(`${this.baseUrl}/register`, payload);
  }

  login(payload: LoginPayload): Observable<AuthActionResponse> {
    return this.http
      .post<AuthActionResponse>(`${this.baseUrl}/login`, payload)
      .pipe(tap(() => this.session.set({ email: payload.email })));
  }

  logout(): Observable<AuthActionResponse> {
    return this.http
      .post<AuthActionResponse>(`${this.baseUrl}/logout`, {})
      .pipe(tap(() => this.session.set(null)));
  }

  clearSession(): void {
    this.session.set(null);
  }
}
