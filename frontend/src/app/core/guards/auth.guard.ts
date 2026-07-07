import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    const requiredRoles = route.data['roles'] as string[] | undefined;
    if (requiredRoles?.length) {
      const userRoles = this.authService.getUserRoles();
      const hasRole = requiredRoles.some((role) => userRoles.includes(role));

      if (!hasRole) {
        this.router.navigate(['/jobs']);
        return false;
      }
    }

    return true;
  }
}
