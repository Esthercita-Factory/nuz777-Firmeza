import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { toApiError } from '../../Services/Api.Service';
import { AuthService } from '../../Services/auth.service';
import { ToastService } from '../../Services/imports.service';
import { LogoComponent } from '../Layout/Shell.Component';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink, LogoComponent],
  template: `
    <div class="flex min-h-screen flex-col bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50">
      <div class="pointer-events-none fixed inset-0 auth-grid opacity-50"></div>

      <header class="relative z-10 flex items-center justify-between px-5 py-4 sm:px-8">
        <a
          routerLink="/"
          class="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:border-blue-400 hover:text-blue-700"
        >
          Volver al inicio
        </a>
        <a routerLink="/" class="inline-flex items-center gap-2.5 px-2 py-1.5 text-slate-900 transition hover:bg-white/60">
          <app-logo size="sm" />
          <span class="text-base font-semibold tracking-tight">Firmeza</span>
        </a>
      </header>

      <main class="relative z-10 flex flex-1 items-center justify-center px-4 pb-16 pt-2">
        <div class="auth-card grid w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl lg:grid-cols-[1fr_1.05fr]">
          <aside class="relative hidden flex-col justify-between overflow-hidden bg-slate-900 p-10 text-white lg:flex">
            <div class="relative flex items-center gap-3">
              <span class="auth-card-badge"><app-logo /></span>
              <span class="text-lg font-semibold tracking-tight">Firmeza</span>
            </div>

            <div class="relative">
              <h2 class="text-3xl font-bold leading-tight tracking-tight">
                Su portal de cliente, <span class="text-sky-400">en minutos</span>
              </h2>
              <ul class="mt-8 space-y-3 text-sm text-slate-200">
                @for (item of highlights; track item) {
                  <li class="flex items-center gap-3">
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

            <p class="relative text-xs text-slate-400">© {{ year }} Firmeza. Todos los derechos reservados.</p>
          </aside>

          <section class="flex flex-col justify-center px-7 py-10 sm:px-12">
            <h1 class="text-2xl font-bold tracking-tight text-slate-900">Crear cuenta</h1>
            <p class="mt-1.5 text-sm text-slate-500">Registro de cliente en el portal.</p>

            @if (errorMessage(); as message) {
              <div class="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700" role="alert">
                {{ message }}
              </div>
            }

            <form class="mt-8 space-y-5" (ngSubmit)="onSubmit()" novalidate>
              <div class="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                <p class="text-xs leading-5 text-blue-900">
                  Tu cuenta queda <strong>pendiente de aprobación</strong>. Un administrador revisará tus datos y al aprobar tu solicitud
                  aparecerás en el listado de clientes de Firmeza.
                </p>
              </div>

              <div>
                <label for="document" class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">Documento / NIT *</label>
                <input
                  id="document"
                  name="document"
                  autocomplete="off"
                  placeholder="Cédula o NIT"
                  class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  [(ngModel)]="document"
                  required
                />
                @if (fieldError('document'); as message) {
                  <p class="mt-1.5 text-xs text-rose-600">{{ message }}</p>
                }
              </div>

              <div>
                <label for="fullName" class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">Nombre completo</label>
                <input
                  id="fullName"
                  name="fullName"
                  autocomplete="name"
                  placeholder="Nombre y apellido"
                  class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  [(ngModel)]="fullName"
                  required
                />
                @if (fieldError('fullName'); as message) {
                  <p class="mt-1.5 text-xs text-rose-600">{{ message }}</p>
                }
              </div>

              <div class="grid gap-5 sm:grid-cols-2">
                <div>
                  <label for="phone" class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">Teléfono *</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autocomplete="tel"
                    placeholder="300 000 0000"
                    class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    [(ngModel)]="phone"
                    required
                  />
                  @if (fieldError('phone'); as message) {
                    <p class="mt-1.5 text-xs text-rose-600">{{ message }}</p>
                  }
                </div>

                <div>
                  <label for="age" class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">Edad *</label>
                  <input
                    id="age"
                    name="age"
                    type="number"
                    min="18"
                    max="120"
                    class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    [(ngModel)]="age"
                    required
                  />
                  @if (fieldError('age'); as message) {
                    <p class="mt-1.5 text-xs text-rose-600">{{ message }}</p>
                  }
                </div>
              </div>

              <div>
                <label for="address" class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">Dirección</label>
                <input
                  id="address"
                  name="address"
                  autocomplete="street-address"
                  placeholder="Opcional"
                  class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  [(ngModel)]="address"
                />
                @if (fieldError('address'); as message) {
                  <p class="mt-1.5 text-xs text-rose-600">{{ message }}</p>
                }
              </div>

              <div>
                <label for="email" class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">Correo</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autocomplete="email"
                  placeholder="nombre@empresa.com"
                  class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  [(ngModel)]="email"
                  required
                />
                @if (fieldError('email'); as message) {
                  <p class="mt-1.5 text-xs text-rose-600">{{ message }}</p>
                }
              </div>

              <div>
                <label for="password" class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">Contraseña</label>
                <input
                  id="password"
                  name="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  autocomplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  [(ngModel)]="password"
                  (ngModelChange)="onPasswordChange()"
                  required
                />

                <div class="mt-2.5 flex gap-1.5" aria-hidden="true">
                  @for (index of [0, 1, 2, 3]; track index) {
                    <span class="h-1.5 flex-1 rounded-full transition-colors" [class]="barClass(index)"></span>
                  }
                </div>
                <p class="mt-1.5 text-xs" [class]="strengthClass()">{{ strengthLabel() }}</p>
                @if (fieldError('password'); as message) {
                  <p class="mt-1.5 text-xs text-rose-600">{{ message }}</p>
                }
              </div>

              <div>
                <label for="confirmPassword" class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">Confirmar contraseña</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  [type]="showPassword() ? 'text' : 'password'"
                  autocomplete="new-password"
                  placeholder="Repita la contraseña"
                  class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  [(ngModel)]="confirmPassword"
                  required
                />
                @if (fieldError('confirmPassword'); as message) {
                  <p class="mt-1.5 text-xs text-rose-600">{{ message }}</p>
                }
              </div>

              <button
                type="submit"
                class="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 text-sm font-semibold tracking-wide text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                [disabled]="loading()"
              >
                {{ loading() ? 'Creando cuenta…' : 'Crear cuenta' }}
              </button>
            </form>

            <p class="mt-6 text-center text-sm text-slate-500">
              ¿Ya tiene cuenta?
              <a routerLink="/login" class="font-semibold text-blue-600 hover:text-blue-700 hover:underline">Iniciar sesión</a>
            </p>
          </section>
        </div>
      </main>
    </div>
  `
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  protected readonly highlights = [
    'Historial de operaciones siempre disponible',
    'Comprobantes descargables en PDF',
    'Datos protegidos con cifrado TLS 1.3'
  ];
  protected readonly year = new Date().getFullYear();

  protected document = '';
  protected fullName = '';
  protected age = 18;
  protected phone = '';
  protected address = '';
  protected email = '';
  protected password = '';
  protected confirmPassword = '';

  protected readonly showPassword = signal(false);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly fieldErrors = signal<Record<string, string>>({});
  protected readonly score = signal(0);

  private readonly levels = [
    { label: 'Muy débil', bar: 'bg-rose-500', text: 'text-rose-600' },
    { label: 'Débil', bar: 'bg-orange-500', text: 'text-orange-600' },
    { label: 'Aceptable', bar: 'bg-amber-400', text: 'text-amber-600' },
    { label: 'Segura', bar: 'bg-emerald-500', text: 'text-emerald-600' }
  ];

  protected readonly strengthLabel = computed(() =>
    this.password.length === 0 ? 'Use 8 o más caracteres con mayúsculas, números y símbolos.' : `Seguridad: ${this.level().label}`
  );

  protected readonly strengthClass = computed(() =>
    this.password.length === 0 ? 'text-slate-400' : this.level().text
  );

  protected fieldError(field: string): string | null {
    return this.fieldErrors()[field] ?? null;
  }

  protected barClass(index: number): string {
    const score = this.score();
    if (this.password.length === 0 || index >= score) return 'bg-slate-200';
    return this.level().bar;
  }

  protected onPasswordChange(): void {
    const value = this.password;
    let score = 0;
    if (value.length >= 8) score++;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
    if (/\d/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;

    this.score.set(score);
  }

  protected onSubmit(): void {
    if (this.loading()) return;

    this.errorMessage.set(null);
    this.fieldErrors.set({});
    this.loading.set(true);

    this.authService
      .register({
        document: this.document.trim(),
        fullName: this.fullName.trim(),
        age: this.age,
        email: this.email.trim(),
        phone: this.phone.trim(),
        address: this.address.trim() || null,
        password: this.password,
        confirmPassword: this.confirmPassword
      })
      .subscribe({
        next: () => {
          this.toastService.success('Solicitud enviada. Un administrador la revisara para activar tu cuenta.');
          this.router.navigate(['/login']);
        },
        error: (error) => {
          const apiError = toApiError(error);
          this.errorMessage.set(apiError.message);
          this.fieldErrors.set(apiError.fieldErrors);
          this.loading.set(false);
        }
      });
  }

  private level() {
    const score = this.score();
    if (score === 0) return this.levels[0];
    return this.levels[Math.max(score, 1) - 1];
  }
}
