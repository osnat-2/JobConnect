import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = localStorage.getItem('jobconnect_token');
    const userRaw = localStorage.getItem('jobconnect_user');

    if (!token) {
      return next.handle(request);
    }

    let email: string | undefined;
    let roles: string[] = [];

    if (userRaw) {
      try {
        const user = JSON.parse(userRaw) as { email?: string; roles?: string[] };
        email = user?.email;
        roles = Array.isArray(user?.roles) ? user.roles.filter(Boolean) : [];
      } catch {
        roles = [];
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`
    };

    if (email) {
      headers['X-User-Email'] = email;
    }

    if (roles.length) {
      headers['X-User-Roles'] = roles.join(',');
    }

    const authRequest = request.clone({
      setHeaders: headers
    });

    return next.handle(authRequest);
  }
}
