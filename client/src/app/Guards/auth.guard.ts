import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../Services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  canActivate(route?: ActivatedRouteSnapshot, state?: RouterStateSnapshot): boolean | UrlTree {
    if (this.authService.isAuthenticated()) {
      return true;
    }

    return this.router.createUrlTree(['/login'], {
      queryParams: state ? { returnUrl: state.url } : undefined
    });
  }
}

export const authGuard = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  return inject(AuthGuard).canActivate(route, state);
};

/** El panel administrativo exige rol Administrador. */
@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  canActivate(): boolean | UrlTree {
    if (!this.authService.isAuthenticated()) {
      return this.router.createUrlTree(['/login']);
    }

    return this.authService.isAdministrator() ? true : this.router.createUrlTree(['/sin-acceso']);
  }
}

export const adminGuard = () => inject(AdminGuard).canActivate();

/** Portal del cliente: exige sesion, pero cualquiera de los dos roles. */
@Injectable({ providedIn: 'root' })
export class CustomerGuard implements CanActivate {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  canActivate(): boolean | UrlTree {
    return this.authService.isAuthenticated() ? true : this.router.createUrlTree(['/login']);
  }
}

export const customerGuard = () => inject(CustomerGuard).canActivate();
