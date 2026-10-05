import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toApiError } from '../../Services/Api.Service';
import { ADMINISTRATOR_ROLE, AuthService } from '../../Services/auth.service';
import { LogoComponent } from '../Layout/Shell.Component';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, LogoComponent],
  template: `
    <div class="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50">
      <!-- Fondo empresarial -->
      <div class="pointer-events-none fixed inset-0 auth-grid opacity-50"></div>
      <div class="auth-blob pointer-events-none fixed -left-24 -top-24 h-96 w-96 rounded-full bg-blue-300/30 blur-3xl"></div>
      <div class="auth-blob pointer-events-none fixed -bottom-32 -right-24 h-96 w-96 rounded-full bg-sky-300/30 blur-3xl" style="animation-delay: -7s"></div>

      <!-- Skyline de edificios -->
      <svg
        class="pointer-events-none absolute inset-x-0 bottom-0 h-64 w-full select-none"
        viewBox="0 0 1200 300"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
      >
        <defs>
          <pattern id="ventanasLogin" width="14" height="18" patternUnits="userSpaceOnUse">
            <rect x="3" y="4" width="6" height="8" fill="#ffffff" opacity=".75" />
          </pattern>
          <g id="edificiosLogin">
            <rect x="0" y="140" width="90" height="160" />
            <rect x="90" y="100" width="70" height="200" />
            <rect x="160" y="170" width="100" height="130" />
            <rect x="260" y="80" width="80" height="220" />
            <rect x="340" y="150" width="110" height="150" />
            <rect x="450" y="110" width="70" height="190" />
            <rect x="520" y="60" width="90" height="240" />
            <rect x="610" y="140" width="100" height="160" />
            <rect x="710" y="90" width="80" height="210" />
            <rect x="790" y="160" width="110" height="140" />
            <rect x="900" y="70" width="80" height="230" />
            <rect x="980" y="130" width="100" height="170" />
            <rect x="1080" y="100" width="120" height="200" />
          </g>
          <clipPath id="recorteLogin"><use href="#edificiosLogin" /></clipPath>
        </defs>
        <use href="#edificiosLogin" fill="#cbd5e1" opacity=".6" />
        <rect width="1200" height="300" fill="url(#ventanasLogin)" clip-path="url(#recorteLogin)" opacity=".6" />
        <g fill="#bfdbfe" opacity=".75">
          <rect x="40" y="200" width="100" height="100" />
          <rect x="140" y="170" width="70" height="130" />
          <rect x="230" y="210" width="120" height="90" />
          <rect x="380" y="180" width="80" height="120" />
          <rect x="490" y="220" width="110" height="80" />
          <rect x="640" y="190" width="90" height="110" />
          <rect x="760" y="215" width="120" height="85" />
          <rect x="910" y="185" width="80" height="115" />
          <rect x="1020" y="210" width="110" height="90" />
        </g>
      </svg>

      <div class="relative z-10 flex min-h-screen flex-col">
        <header class="animate-rise flex items-center justify-between px-5 py-4 sm:px-8">
          <a
            routerLink="/"
            class="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-blue-400 hover:text-blue-700"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Volver al inicio
          </a>
          <a routerLink="/" class="inline-flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-slate-900 transition hover:bg-white/60">
            <app-logo size="sm" />
            <span class="text-base font-semibold tracking-tight">Firmeza</span>
          </a>
        </header>

        <main class="flex flex-1 items-center justify-center px-4 pb-16 pt-2">
          <div class="auth-card grid w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl shadow-slate-300/50 backdrop-blur lg:grid-cols-[1fr_1.05fr]">
            <!-- Panel de marca -->
            <aside class="relative hidden flex-col justify-between overflow-hidden bg-slate-900 p-10 text-white lg:flex">
              <div class="pointer-events-none absolute inset-0 opacity-[0.07] brand-grid"></div>
              <div class="auth-blob pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-blue-500/30 blur-3xl"></div>
              <div class="auth-blob pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl" style="animation-delay: -5s"></div>

              <div class="animate-rise animate-rise-1 relative flex items-center gap-3">
                <app-logo />
                <span class="text-lg font-semibold tracking-tight">Firmeza</span>
              </div>

              <div class="relative">
                <h2 class="animate-rise animate-rise-2 text-3xl font-bold leading-tight tracking-tight">
                  Gestión empresarial con <span class="text-sky-400">control y trazabilidad</span>
                </h2>
                <p class="animate-rise animate-rise-3 mt-4 max-w-sm text-sm leading-6 text-slate-300">
                  Inventario, clientes y ventas en una sola plataforma, con acceso por roles y registro de cada operación.
                </p>
                <ul class="mt-8 space-y-3 text-sm text-slate-200">
                  @for (item of highlights; track item; let i = $index) {
                    <li class="animate-rise flex items-center gap-3" [class]="'animate-rise-' + (i + 4)">
                      <span class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-500/20 text-sky-300">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                      {{ item }}
                    </li>
                  }
                </ul>
              </div>

              <p class="animate-rise animate-rise-5 relative text-xs text-slate-400">© {{ year }} Firmeza. Todos los derechos reservados.</p>
            </aside>

            <!-- Formulario -->
            <section class="flex flex-col justify-center px-7 py-10 sm:px-12">
              <div class="animate-rise">
                <h1 class="text-2xl font-bold tracking-tight text-slate-900">Iniciar sesión</h1>
                <p class="mt-1.5 text-sm text-slate-500">Acceso restringido a personal autorizado.</p>
              </div>

              @if (errorMessage(); as message) {
                <div class="animate-shake mt-6 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700" role="alert">
                  {{ message }}
                </div>
              }

              <form class="mt-8 space-y-5" (ngSubmit)="onSubmit()" novalidate>
                <div class="animate-rise animate-rise-1">
                  <label for="email" class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">Correo</label>
                  <div class="flex items-center overflow-hidden rounded-xl border border-slate-300 bg-white transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
                    <span class="grid w-12 shrink-0 place-items-center text-slate-400">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-[18px] w-[18px]" aria-hidden="true">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="m22 7-10 6L2 7" />
                      </svg>
                    </span>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autocomplete="email"
                      placeholder="nombre@empresa.com"
                      class="min-w-0 flex-1 border-0 bg-transparent px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                      [(ngModel)]="email"
                      required
                    />
                  </div>
                </div>

                <div class="animate-rise animate-rise-2">
                  <label for="password" class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">Contraseña</label>
                  <div class="flex items-center overflow-hidden rounded-xl border border-slate-300 bg-white transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
                    <span class="grid w-12 shrink-0 place-items-center text-slate-400">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-[18px] w-[18px]" aria-hidden="true">
                        <rect x="4" y="10" width="16" height="11" rx="2" />
                        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                      </svg>
                    </span>
                    <input
                      id="password"
                      name="password"
                      [type]="showPassword() ? 'text' : 'password'"
                      autocomplete="current-password"
                      placeholder="••••••••"
                      class="min-w-0 flex-1 border-0 bg-transparent px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-300"
                      [(ngModel)]="password"
                      (keyup)="onPasswordKey($event)"
                      (blur)="capsLock.set(false)"
                      required
                    />
                    <button
                      type="button"
                      aria-label="Mostrar u ocultar contraseña"
                      class="grid w-12 shrink-0 place-items-center text-slate-400 transition hover:text-slate-700"
                      (click)="showPassword.set(!showPassword())"
                    >
                      @if (showPassword()) {
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-[18px] w-[18px]">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-6.5 0-10-7-10-7a18.5 18.5 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19" />
                          <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
                          <line x1="2" y1="2" x2="22" y2="22" />
                        </svg>
                      } @else {
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-[18px] w-[18px]">
                          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      }
                    </button>
                  </div>
                  @if (capsLock()) {
                    <p class="mt-1.5 flex items-center gap-1.5 text-xs text-amber-600">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5">
                        <path d="M12 3 3 14h6v4h6v-4h6z" />
                        <line x1="9" y1="21" x2="15" y2="21" />
                      </svg>
                      Bloq Mayús está activado
                    </p>
                  }
                </div>

                <button
                  type="submit"
                  class="animate-rise animate-rise-3 group flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 text-sm font-semibold tracking-wide text-white shadow-sm transition hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                  [disabled]="loading()"
                >
                  @if (loading()) {
                    <svg viewBox="0 0 24 24" fill="none" class="h-4 w-4 animate-spin">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-25" />
                      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
                    </svg>
                    Verificando…
                  } @else {
                    Ingresar
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 transition-transform group-hover:translate-x-1">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  }
                </button>
              </form>

              <div class="animate-rise animate-rise-4 mt-6 flex items-center gap-2 rounded-lg bg-slate-50 px-3.5 py-2.5 text-xs text-slate-500">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                Conexión protegida con cifrado TLS 1.3
              </div>

              <p class="animate-rise animate-rise-5 mt-6 text-center text-sm text-slate-500">
                ¿Eres cliente?
                <a routerLink="/register" class="font-semibold text-blue-600 hover:text-blue-700 hover:underline">Solicitar registro</a>
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  `
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly highlights = [
    'Acceso segmentado por rol y permisos',
    'Historial auditable de operaciones',
    'Comunicación cifrada de extremo a extremo'
  ];
  protected readonly year = new Date().getFullYear();

  protected email = '';
  protected password = '';
  protected readonly showPassword = signal(false);
  protected readonly capsLock = signal(false);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected onPasswordKey(event: KeyboardEvent): void {
    this.capsLock.set(event.getModifierState?.('CapsLock') ?? false);
  }

  protected onSubmit(): void {
    if (this.loading()) return;

    this.errorMessage.set(null);
    this.loading.set(true);

    this.authService.login({ email: this.email.trim(), password: this.password }).subscribe({
      next: (tokens) => {
        this.authService.saveSession(tokens);

        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

        // El destino depende del rol: el administrador entra al panel, el cliente
        // a su portal. Antes el login rechazaba al cliente; ahora cada rol tiene
        // su landing y adminGuard protege el panel por separado.
        if (tokens.user.roles.includes(ADMINISTRATOR_ROLE)) {
          this.router.navigate([returnUrl && returnUrl.startsWith('/') ? returnUrl : '/dashboard']);
          return;
        }

        this.router.navigate([returnUrl && returnUrl.startsWith('/') ? returnUrl : '/tienda']);
      },
      error: (error) => {
        this.errorMessage.set(toApiError(error).message);
        this.loading.set(false);
      }
    });
  }
}
