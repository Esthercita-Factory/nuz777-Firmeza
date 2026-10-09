import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { toApiError } from '../../Services/Api.Service';
import { ADMINISTRATOR_ROLE, AuthService } from '../../Services/auth.service';
import { AdminNotificationService } from '../../Services/admin-notification.service';

@Component({
  selector: 'app-login',
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
          <pattern id="ventanasLogin" width="14" height="18" patternUnits="userSpaceOnUse">
            <rect x="3" y="4" width="6" height="8" fill="#ffffff" opacity=".85" />
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

        <!-- Capa de fondo de edificios (gris pizarra claro) -->
        <use href="#edificiosLogin" fill="#cbd5e1" opacity=".6" />
        <rect width="1200" height="300" fill="url(#ventanasLogin)" clip-path="url(#recorteLogin)" opacity=".7" />

        <!-- Capa frontal de edificios (azul institucional suave) -->
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
          <span>¿No tienes cuenta?</span>
          <a routerLink="/register" class="font-bold text-blue-600 hover:text-blue-500 hover:underline">
            Solicitar registro →
          </a>
        </div>
      </header>

      <!-- Tarjeta central de autenticación -->
      <main class="relative z-10 my-auto flex w-full justify-center py-6">
        <div class="auth-card w-full max-w-[450px] overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 p-8 text-slate-900 shadow-2xl shadow-slate-300/60 backdrop-blur-md sm:p-10">
          <!-- Favicon / Logo institucional destacado -->
          <div class="text-center">
            <div class="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-2.5 shadow-md shadow-blue-500/10 ring-1 ring-slate-200">
              <img src="img/favicon.png" alt="Firmeza" class="h-full w-full object-contain" />
            </div>
            <h1 class="mt-4 text-2xl font-black tracking-tight text-slate-950">Iniciar sesión</h1>
            <p class="mt-1 text-xs text-slate-500">Accede a la plataforma de Ferretería Firmeza</p>
          </div>

          <!-- Selector de tipo de ingreso: Correo o Cédula / Documento -->
          <div class="mt-6 flex rounded-xl border border-slate-200 bg-slate-100/80 p-1 text-xs font-bold">
            <button
              type="button"
              (click)="setLoginType('email')"
              class="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 transition"
              [class]="loginType() === 'email' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-3.5 w-3.5">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-10 6L2 7" />
              </svg>
              Correo
            </button>
            <button
              type="button"
              (click)="setLoginType('document')"
              class="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 transition"
              [class]="loginType() === 'document' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-3.5 w-3.5">
                <rect x="3" y="4" width="18" height="16" rx="3" />
                <circle cx="9" cy="10" r="2" />
                <path d="M15 8h2M15 12h2M7 16h10" />
              </svg>
              Cédula / NIT
            </button>
          </div>

          <!-- Mensaje de error si falla la autenticación -->
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

          <!-- Formulario de acceso -->
          <form class="mt-5 space-y-4" (ngSubmit)="onSubmit()" (input)="saveDraft()" (change)="saveDraft()" novalidate>
            @if (loginType() === 'document') {
              <div>
                <div class="mb-1.5 flex items-center justify-between">
                  <label for="document" class="block text-xs font-bold text-slate-700">
                    Cédula / Documento / NIT *
                  </label>
                  <span class="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Solo números
                  </span>
                </div>
                <div class="relative flex items-center">
                  <span class="pointer-events-none absolute left-3.5 text-slate-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
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
                    placeholder="Ej: 1020304050"
                    class="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    [(ngModel)]="document"
                    (keydown)="onNumericKeyDown($event, 'el documento')"
                    (input)="onNumericInput($event, 'el documento')"
                    (paste)="onNumericPaste($event, 'el documento')"
                    required
                  />
                </div>
              </div>
            } @else {
              <div>
                <label for="email" class="mb-1.5 block text-xs font-bold text-slate-700">
                  Correo electrónico *
                </label>
                <div class="relative flex items-center">
                  <span class="pointer-events-none absolute left-3.5 text-slate-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-10 6L2 7" />
                    </svg>
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autocomplete="email"
                    placeholder="ejemplo@firmeza.com"
                    class="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    [(ngModel)]="email"
                    required
                  />
                </div>
              </div>
            }

            <div>
              <div class="mb-1.5 flex items-center justify-between">
                <label for="password" class="block text-xs font-bold text-slate-700">
                  Contraseña *
                </label>
              </div>
              <div class="relative flex items-center">
                <span class="pointer-events-none absolute left-3.5 text-slate-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
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
                  class="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-3 pl-10 pr-11 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  [(ngModel)]="password"
                  (keyup)="onPasswordKey($event)"
                  (blur)="capsLock.set(false)"
                  required
                />
                <button
                  type="button"
                  aria-label="Mostrar u ocultar contraseña"
                  class="absolute right-3 grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  (click)="showPassword.set(!showPassword())"
                >
                  @if (showPassword()) {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-6.5 0-10-7-10-7a18.5 18.5 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19" />
                      <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
                      <line x1="2" y1="2" x2="22" y2="22" />
                    </svg>
                  } @else {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  }
                </button>
              </div>

              @if (capsLock()) {
                <p class="mt-1.5 flex items-center gap-1.5 text-xs text-amber-600">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-3.5 w-3.5">
                    <path d="M12 3 3 14h6v4h6v-4h6z" />
                    <line x1="9" y1="21" x2="15" y2="21" />
                  </svg>
                  Bloq Mayús está activado
                </p>
              }
            </div>

            <button
              type="submit"
              class="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              [disabled]="loading()"
            >
              @if (loading()) {
                <svg viewBox="0 0 24 24" fill="none" class="h-4 w-4 animate-spin text-white">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-25" />
                  <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
                </svg>
                <span>Verificando credenciales…</span>
              } @else {
                <span>Ingresar al sistema</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 transition-transform group-hover:translate-x-1">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              }
            </button>
          </form>

          <div class="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-500">
            ¿Eres cliente registrado?
            <a routerLink="/register" class="font-bold text-blue-600 hover:text-blue-500 hover:underline">
              Solicita tu cuenta aquí
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
export class LoginComponent implements OnInit {
  private static readonly DRAFT_KEY = 'firmeza-draft-login';

  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(AdminNotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly year = new Date().getFullYear();

  protected readonly loginType = signal<'email' | 'document'>('email');
  protected email = '';
  protected document = '';
  protected password = '';
  protected readonly showPassword = signal(false);
  protected readonly capsLock = signal(false);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.restoreDraft();
  }

  protected setLoginType(type: 'email' | 'document'): void {
    this.loginType.set(type);
    this.saveDraft();
  }

  private lastToastTime = 0;

  /**
   * Notificación sencilla SweetAlert en la esquina superior derecha (top-end)
   * que alerta al usuario cuando escribe caracteres no numéricos en campos numéricos.
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

  /**
   * Valida en tiempo real durante la pulsación de teclas (keydown).
   * Si el usuario escribe una letra u otro caracter no numérico, lo bloquea y avisa con SweetAlert.
   */
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

    // Permitir combinaciones de control como Ctrl+A, Ctrl+C, Ctrl+V
    if (event.ctrlKey || event.metaKey) {
      return;
    }

    // Si la tecla no es un dígito
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
      this.notifyNumericWarning(fieldName);
    }
  }

  /**
   * Limpia cualquier caracter no numérico si llega a insertarse (por ejemplo mediante arrastre o teclado virtual).
   */
  protected onNumericInput(event: Event, fieldName: string): void {
    const target = event.target as HTMLInputElement;
    if (!target) return;

    if (/\D/.test(target.value)) {
      target.value = target.value.replace(/\D/g, '');
      this.document = target.value;
      this.notifyNumericWarning(fieldName);
    }
  }

  /**
   * Detecta cuando el usuario pega texto que contiene letras en el campo numérico.
   */
  protected onNumericPaste(event: ClipboardEvent, fieldName: string): void {
    const pasted = event.clipboardData?.getData('text') ?? '';
    if (/\D/.test(pasted)) {
      this.notifyNumericWarning(fieldName);
    }
  }

  protected onPasswordKey(event: KeyboardEvent): void {
    this.capsLock.set(event.getModifierState?.('CapsLock') ?? false);
  }

  protected onSubmit(): void {
    if (this.loading()) return;

    const identifier = this.loginType() === 'document' ? this.document.trim() : this.email.trim();

    if (!identifier) {
      this.errorMessage.set(
        this.loginType() === 'document' ? 'Ingresa tu número de documento.' : 'Ingresa tu correo electrónico.'
      );
      return;
    }

    this.errorMessage.set(null);
    this.loading.set(true);

    this.authService.login({ email: identifier, password: this.password }).subscribe({
      next: (tokens) => {
        this.clearDraft();
        this.authService.saveSession(tokens);

        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

        // El destino depende del rol: el administrador entra al panel, el cliente a la tienda
        if (tokens.user.roles.includes(ADMINISTRATOR_ROLE)) {
          this.notificationService.onAdminLogin();
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

  protected saveDraft(): void {
    queueMicrotask(() => {
      try {
        const draft = {
          loginType: this.loginType(),
          email: this.email,
          document: this.document
        };
        localStorage.setItem(LoginComponent.DRAFT_KEY, JSON.stringify(draft));
      } catch {}
    });
  }

  @HostListener('window:beforeunload')
  protected onBeforeUnload(): void {
    try {
      const draft = {
        loginType: this.loginType(),
        email: this.email,
        document: this.document
      };
      localStorage.setItem(LoginComponent.DRAFT_KEY, JSON.stringify(draft));
    } catch {}
  }

  private clearDraft(): void {
    try {
      localStorage.removeItem(LoginComponent.DRAFT_KEY);
    } catch {}
  }

  private restoreDraft(): void {
    try {
      const raw = localStorage.getItem(LoginComponent.DRAFT_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.loginType === 'email' || data.loginType === 'document') {
        this.loginType.set(data.loginType);
      }
      if (typeof data.email === 'string') this.email = data.email;
      if (typeof data.document === 'string') this.document = data.document;
    } catch {}
  }
}
