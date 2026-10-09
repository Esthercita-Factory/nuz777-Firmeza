import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { toApiError } from '../../Services/Api.Service';
import { AuthService } from '../../Services/auth.service';
import { ToastService } from '../../Services/imports.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="relative flex min-h-screen flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50/50 px-4 py-8 text-slate-800 sm:px-6 lg:px-8">
      <!-- Malla de fondo sutil y orbes de iluminación suave -->
      <div class="pointer-events-none fixed inset-0 auth-grid opacity-60"></div>
      <div class="pointer-events-none fixed -left-28 -top-28 h-96 w-96 rounded-full bg-blue-200/40 blur-3xl"></div>
      <div class="pointer-events-none fixed -bottom-32 -right-28 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl"></div>

      <!-- Skyline de edificios en fondo blanco / claro -->
      <svg
        class="pointer-events-none absolute inset-x-0 bottom-0 h-72 w-full select-none"
        viewBox="0 0 1200 300"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
      >
        <defs>
          <pattern id="ventanasReg" width="14" height="18" patternUnits="userSpaceOnUse">
            <rect x="3" y="4" width="6" height="8" fill="#ffffff" opacity=".85" />
          </pattern>
          <g id="edificiosReg">
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
          <clipPath id="recorteReg"><use href="#edificiosReg" /></clipPath>
        </defs>

        <use href="#edificiosReg" fill="#cbd5e1" opacity=".6" />
        <rect width="1200" height="300" fill="url(#ventanasReg)" clip-path="url(#recorteReg)" opacity=".7" />

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

      <!-- Barra superior con enlace de retorno -->
      <header class="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between">
        <a
          routerLink="/"
          class="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/90 px-4 py-2 text-xs font-bold text-slate-700 shadow-sm backdrop-blur transition hover:border-blue-400 hover:bg-white hover:text-blue-700"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Volver al portal
        </a>

        <div class="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <span>¿Ya tienes cuenta?</span>
          <a routerLink="/login" class="font-bold text-blue-600 hover:text-blue-500 hover:underline">
            Iniciar sesión →
          </a>
        </div>
      </header>

      <!-- Tarjeta central de registro -->
      <main class="relative z-10 my-auto flex w-full justify-center py-6">
        <div class="auth-card w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 p-8 text-slate-900 shadow-2xl shadow-slate-300/50 backdrop-blur-md sm:p-10">
          <!-- Favicon / Logo de Firmeza -->
          <div class="text-center">
            <div class="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-2.5 shadow-md shadow-blue-500/10 ring-1 ring-slate-200">
              <img src="img/favicon.png" alt="Firmeza" class="h-full w-full object-contain" />
            </div>
            <h1 class="mt-4 text-2xl font-black tracking-tight text-slate-950">Registro de cliente</h1>
            <p class="mt-1 text-xs text-slate-500">Completa tus datos para solicitar acceso y comprar en Ferretería Firmeza</p>
          </div>

          <!-- Banner explicativo de aprobación -->
          <div class="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
            <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-xs font-black text-white">
              i
            </div>
            <div class="text-xs leading-5 text-amber-900">
              <span class="font-bold">Aprobación administrativa:</span> Tu cuenta quedará pendiente de validación. Un administrador confirmará tus datos para habilitar tus compras en el portal.
            </div>
          </div>

          <!-- Mensaje de error general -->
          @if (errorMessage(); as message) {
            <div class="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-800" role="alert">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mt-0.5 h-4 w-4 shrink-0 text-rose-600">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{{ message }}</span>
            </div>
          }

          <!-- Formulario de registro -->
          <form class="mt-6 space-y-4" (ngSubmit)="onSubmit()" (input)="saveDraft()" (change)="saveDraft()" novalidate>
            <!-- Grupo: Identificación -->
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <div class="mb-1.5 flex items-center justify-between">
                  <label for="document" class="block text-xs font-bold text-slate-700">
                    Documento / NIT *
                  </label>
                  <span class="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    Solo números
                  </span>
                </div>
                <div class="relative flex items-center">
                  <span class="pointer-events-none absolute left-3.5 text-slate-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                      <rect x="3" y="4" width="18" height="16" rx="3" />
                      <circle cx="9" cy="10" r="2" />
                      <path d="M15 8h2M15 12h2M7 16h10" />
                    </svg>
                  </span>
                  <input
                    id="document"
                    name="document"
                    type="text"
                    inputmode="numeric"
                    autocomplete="off"
                    placeholder="Cédula o NIT sin DV"
                    class="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    [(ngModel)]="document"
                    (keydown)="onNumericKeyDown($event, 'el documento')"
                    (input)="onNumericInput($event, 'el documento')"
                    (paste)="onNumericPaste($event, 'el documento')"
                    required
                  />
                </div>
                @if (fieldError('document'); as message) {
                  <p class="mt-1 text-xs font-semibold text-rose-600">{{ message }}</p>
                }
              </div>

              <div>
                <label for="fullName" class="mb-1.5 block text-xs font-bold text-slate-700">
                  Nombre completo o Razón Social *
                </label>
                <div class="relative flex items-center">
                  <span class="pointer-events-none absolute left-3.5 text-slate-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <input
                    id="fullName"
                    name="fullName"
                    autocomplete="name"
                    placeholder="Nombre completo"
                    class="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    [(ngModel)]="fullName"
                    required
                  />
                </div>
                @if (fieldError('fullName'); as message) {
                  <p class="mt-1 text-xs font-semibold text-rose-600">{{ message }}</p>
                }
              </div>
            </div>

            <!-- Grupo: Teléfono y Edad -->
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <div class="mb-1.5 flex items-center justify-between">
                  <label for="phone" class="block text-xs font-bold text-slate-700">
                    Teléfono / Celular *
                  </label>
                  <span class="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    Solo números
                  </span>
                </div>
                <div class="relative flex items-center">
                  <span class="pointer-events-none absolute left-3.5 text-slate-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </span>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputmode="numeric"
                    autocomplete="tel"
                    placeholder="Ej: 3101234567"
                    class="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    [(ngModel)]="phone"
                    (keydown)="onNumericKeyDown($event, 'el teléfono')"
                    (input)="onNumericInput($event, 'el teléfono')"
                    (paste)="onNumericPaste($event, 'el teléfono')"
                    required
                  />
                </div>
                @if (fieldError('phone'); as message) {
                  <p class="mt-1 text-xs font-semibold text-rose-600">{{ message }}</p>
                }
              </div>

              <div>
                <div class="mb-1.5 flex items-center justify-between">
                  <label for="age" class="block text-xs font-bold text-slate-700">
                    Edad *
                  </label>
                  <span class="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    Solo números
                  </span>
                </div>
                <input
                  id="age"
                  name="age"
                  type="number"
                  min="18"
                  max="120"
                  placeholder="Mínimo 18 años"
                  class="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-3 px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  [(ngModel)]="age"
                  (keydown)="onNumericKeyDown($event, 'la edad')"
                  required
                />
                @if (fieldError('age'); as message) {
                  <p class="mt-1 text-xs font-semibold text-rose-600">{{ message }}</p>
                }
              </div>
            </div>

            <!-- Grupo: Correo y Dirección -->
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label for="email" class="mb-1.5 block text-xs font-bold text-slate-700">
                  Correo electrónico *
                </label>
                <div class="relative flex items-center">
                  <span class="pointer-events-none absolute left-3.5 text-slate-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-10 6L2 7" />
                    </svg>
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autocomplete="email"
                    placeholder="tu@correo.com"
                    class="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    [(ngModel)]="email"
                    required
                  />
                </div>
                @if (fieldError('email'); as message) {
                  <p class="mt-1 text-xs font-semibold text-rose-600">{{ message }}</p>
                }
              </div>

              <div>
                <label for="address" class="mb-1.5 block text-xs font-bold text-slate-700">
                  Dirección de entrega <span class="text-slate-400 font-normal">(Opcional)</span>
                </label>
                <div class="relative flex items-center">
                  <span class="pointer-events-none absolute left-3.5 text-slate-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </span>
                  <input
                    id="address"
                    name="address"
                    autocomplete="street-address"
                    placeholder="Calle, número, barrio"
                    class="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    [(ngModel)]="address"
                  />
                </div>
                @if (fieldError('address'); as message) {
                  <p class="mt-1 text-xs font-semibold text-rose-600">{{ message }}</p>
                }
              </div>
            </div>

            <!-- Grupo: Contraseña y Confirmación -->
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label for="password" class="mb-1.5 block text-xs font-bold text-slate-700">
                  Contraseña *
                </label>
                <div class="relative flex items-center">
                  <span class="pointer-events-none absolute left-3.5 text-slate-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                      <rect x="4" y="10" width="16" height="11" rx="2" />
                      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                    </svg>
                  </span>
                  <input
                    id="password"
                    name="password"
                    [type]="showPassword() ? 'text' : 'password'"
                    autocomplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                    class="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-3 pl-10 pr-11 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    [(ngModel)]="password"
                    (input)="onPasswordChange()"
                    required
                  />
                  <button
                    type="button"
                    aria-label="Mostrar u ocultar contraseña"
                    class="absolute right-3 grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    (click)="showPassword.set(!showPassword())"
                  >
                    @if (showPassword()) {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-6.5 0-10-7-10-7a18.5 18.5 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19" />
                        <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
                        <line x1="2" y1="2" x2="22" y2="22" />
                      </svg>
                    } @else {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    }
                  </button>
                </div>
                <!-- Barra de fortaleza -->
                <div class="mt-2">
                  <div class="flex gap-1">
                    <span class="h-1 flex-1 rounded-full transition-colors duration-300" [class]="barClass(0)"></span>
                    <span class="h-1 flex-1 rounded-full transition-colors duration-300" [class]="barClass(1)"></span>
                    <span class="h-1 flex-1 rounded-full transition-colors duration-300" [class]="barClass(2)"></span>
                    <span class="h-1 flex-1 rounded-full transition-colors duration-300" [class]="barClass(3)"></span>
                  </div>
                  <p class="mt-1 text-[11px] font-semibold" [class]="strengthClass()">{{ strengthLabel() }}</p>
                </div>
                @if (fieldError('password'); as message) {
                  <p class="mt-1 text-xs font-semibold text-rose-600">{{ message }}</p>
                }
              </div>

              <div>
                <label for="confirmPassword" class="mb-1.5 block text-xs font-bold text-slate-700">
                  Confirmar contraseña *
                </label>
                <div class="relative flex items-center">
                  <span class="pointer-events-none absolute left-3.5 text-slate-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                      <rect x="4" y="10" width="16" height="11" rx="2" />
                      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                    </svg>
                  </span>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    [type]="showPassword() ? 'text' : 'password'"
                    autocomplete="new-password"
                    placeholder="Repite la contraseña"
                    class="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    [(ngModel)]="confirmPassword"
                    required
                  />
                </div>
                @if (fieldError('confirmPassword'); as message) {
                  <p class="mt-1 text-xs font-semibold text-rose-600">{{ message }}</p>
                }
              </div>
            </div>

            <button
              type="submit"
              class="group mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              [disabled]="loading()"
            >
              @if (loading()) {
                <svg viewBox="0 0 24 24" fill="none" class="h-4 w-4 animate-spin text-white">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-25" />
                  <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
                </svg>
                <span>Enviando solicitud…</span>
              } @else {
                <span>Enviar solicitud de registro</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="h-4 w-4 transition-transform group-hover:translate-x-1">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              }
            </button>
          </form>

          <div class="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-500">
            ¿Ya tienes una cuenta aprobada?
            <a routerLink="/login" class="font-bold text-blue-600 hover:text-blue-500 hover:underline">
              Iniciar sesión aquí
            </a>
          </div>
        </div>
      </main>

      <!-- Pie de página con seguridad -->
      <footer class="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between text-xs text-slate-500">
        <p>© {{ year }} Firmeza · Todos los derechos reservados.</p>
        <div class="flex items-center gap-1.5 text-slate-500">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-3.5 w-3.5 text-emerald-600">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          <span>Conexión cifrada TLS 1.3</span>
        </div>
      </footer>
    </div>
  `
})
export class RegisterComponent implements OnInit {
  private static readonly DRAFT_KEY = 'firmeza-draft-register';

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  protected readonly year = new Date().getFullYear();

  protected document = '';
  protected fullName = '';
  protected age = 18;
  protected phone = '';
  protected address = '';
  protected email = '';
  protected password = '';
  protected confirmPassword = '';

  ngOnInit(): void {
    this.restoreDraft();
  }

  protected readonly showPassword = signal(false);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly fieldErrors = signal<Record<string, string>>({});
  protected readonly score = signal(0);

  private lastToastTime = 0;

  /**
   * Notificación SweetAlert en esquina superior derecha para advertir caracteres no numéricos.
   */
  protected notifyNumericWarning(fieldName: string = 'este campo'): void {
    const now = Date.now();
    if (now - this.lastToastTime < 700) {
      return;
    }
    this.lastToastTime = now;

    void Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'warning',
      title: `Solo se permiten números en ${fieldName}`,
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true
    });
  }

  protected onNumericKeyDown(event: KeyboardEvent, fieldName: string): void {
    const allowedNavigationKeys = [
      'Backspace',
      'Tab',
      'Enter',
      'Delete',
      'Escape',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End'
    ];

    if (allowedNavigationKeys.includes(event.key)) {
      return;
    }

    if (event.ctrlKey || event.metaKey) {
      return;
    }

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
      this.notifyNumericWarning(fieldName);
    }
  }

  protected onNumericInput(event: Event, fieldName: string): void {
    const target = event.target as HTMLInputElement;
    if (!target) return;

    if (/\D/.test(target.value)) {
      target.value = target.value.replace(/\D/g, '');
      if (fieldName === 'el documento') this.document = target.value;
      if (fieldName === 'el teléfono') this.phone = target.value;
      this.notifyNumericWarning(fieldName);
    }
  }

  protected onNumericPaste(event: ClipboardEvent, fieldName: string): void {
    const pasted = event.clipboardData?.getData('text') ?? '';
    if (/\D/.test(pasted)) {
      this.notifyNumericWarning(fieldName);
    }
  }

  private readonly levels = [
    { label: 'Muy débil', bar: 'bg-rose-500', text: 'text-rose-600' },
    { label: 'Débil', bar: 'bg-orange-500', text: 'text-orange-600' },
    { label: 'Aceptable', bar: 'bg-amber-400', text: 'text-amber-600' },
    { label: 'Segura', bar: 'bg-emerald-500', text: 'text-emerald-600' }
  ];

  protected readonly strengthLabel = computed(() =>
    this.password.length === 0 ? 'Mínimo 8 caracteres con números y letras.' : `Seguridad: ${this.level().label}`
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
          this.clearDraft();
          this.toastService.success('Solicitud enviada. Un administrador la revisará para activar tu cuenta.');
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

  protected saveDraft(): void {
    queueMicrotask(() => {
      try {
        const draft = {
          document: this.document,
          fullName: this.fullName,
          age: this.age,
          phone: this.phone,
          address: this.address,
          email: this.email,
          password: this.password,
          confirmPassword: this.confirmPassword
        };
        localStorage.setItem(RegisterComponent.DRAFT_KEY, JSON.stringify(draft));
      } catch {}
    });
  }

  @HostListener('window:beforeunload')
  protected onBeforeUnload(): void {
    try {
      const draft = {
        document: this.document,
        fullName: this.fullName,
        age: this.age,
        phone: this.phone,
        address: this.address,
        email: this.email,
        password: this.password,
        confirmPassword: this.confirmPassword
      };
      localStorage.setItem(RegisterComponent.DRAFT_KEY, JSON.stringify(draft));
    } catch {}
  }

  private clearDraft(): void {
    try {
      localStorage.removeItem(RegisterComponent.DRAFT_KEY);
    } catch {}
  }

  private restoreDraft(): void {
    try {
      const raw = localStorage.getItem(RegisterComponent.DRAFT_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (typeof data.document === 'string') this.document = data.document;
      if (typeof data.fullName === 'string') this.fullName = data.fullName;
      if (typeof data.phone === 'string') this.phone = data.phone;
      if (data.age !== undefined && data.age !== null) this.age = Number(data.age) || 18;
      if (typeof data.email === 'string') this.email = data.email;
      if (typeof data.address === 'string') this.address = data.address;
      if (typeof data.password === 'string') this.password = data.password;
      if (typeof data.confirmPassword === 'string') this.confirmPassword = data.confirmPassword;
      if (this.password) {
        this.onPasswordChange();
      }
    } catch {}
  }

  private level() {
    const score = this.score();
    if (score === 0) return this.levels[0];
    return this.levels[Math.max(score, 1) - 1];
  }
}
