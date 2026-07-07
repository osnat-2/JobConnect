import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName?: string;
  email: string;
  password: string;
  role: 'Candidate' | 'Manager';
}

export interface AuthResponse {
  accessToken?: string;
  token?: string;
  user?: {
    id?: string;
    email?: string;
    roles?: string[];
  };
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly tokenKey = 'jobconnect_token';
  private readonly userKey = 'jobconnect_user';
  private readonly authUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.authUrl}/login`, credentials).pipe(
      tap((response) => this.storeCredentials(response))
    );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.authUrl}/register`, userData).pipe(
      tap((response) => this.storeCredentials(response))
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUser(): { id?: string; email?: string; roles?: string[] } | undefined {
    const raw = localStorage.getItem(this.userKey);
    if (!raw) {
      return undefined;
    }

    try {
      return JSON.parse(raw);
    } catch {
      return undefined;
    }
  }

  getUserRoles(): string[] {
    return this.getUser()?.roles ?? [];
  }

  isAuthenticated(): boolean {
    return Boolean(this.getToken());
  }

  private storeCredentials(response: AuthResponse): void {
    const token = response.accessToken || response.token;
    if (token) {
      localStorage.setItem(this.tokenKey, token);
    }

    if (response.user) {
      localStorage.setItem(this.userKey, JSON.stringify(response.user));
    }
  }
}