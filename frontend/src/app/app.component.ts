import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './features/auth/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'JobConnect - Applicant Tracking System';

  constructor(public authService: AuthService, private router: Router) {}

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  get username(): string | undefined {
    return this.authService.getUser()?.email;
  }

  get roles(): string[] {
    return this.authService.getUserRoles();
  }

  get isManager(): boolean {
    return this.roles.includes('Manager');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
