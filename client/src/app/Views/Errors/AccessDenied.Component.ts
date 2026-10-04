import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../Services/auth.service';

@Component({
  selector: 'app-access-denied',
  imports: [RouterLink],
  template: `
    <div class="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-5 text-center">
      <span class="grid h-16 w-16 place-items-center rounded-2xl bg-rose-100 text-rose-600">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-8 w-8">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </span>
      <h1 class="mt-6 text-3xl font-black tracking-tight text-slate-950">Acceso denegado</h1>
      <p class="mt-3 text-slate-500">
        La cuenta <span class="font-bold text-slate-700">{{ authService.getUser()?.email }}</span> no tiene el rol
        <span class="font-bold text-slate-700">Administrador</span> requerido para el panel.
      </p>
      <button
        type="button"
        class="mt-8 rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-500 hover:text-slate-950"
        (click)="logout()"
      >
        Cerrar sesión
      </button>
      <a routerLink="/" class="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-500">Volver al inicio</a>
    </div>
  `
})
export class AccessDeniedComponent {
  protected readonly authService = inject(AuthService);

  protected logout(): void {
    this.authService.logout(false);
    window.location.assign('/');
  }
}
