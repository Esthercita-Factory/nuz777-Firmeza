import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../Services/auth.service';
import { CartService } from '../../Services/cart.service';
import { LogoComponent } from '../Layout/Shell.Component';
import { IconComponent } from '../Shared/Icon.Component';

/**
 * Layout del portal del cliente. Es distinto del panel de administracion: el
 * cliente ve el catalogo, el carrito y su sesion, nada del inventario ni del
 * directorio de clientes.
 */
@Component({
  selector: 'app-client-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LogoComponent, IconComponent],
  template: `
    <div class="relative flex min-h-screen flex-col justify-between overflow-x-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50/40 text-slate-800">
      <!-- Malla de fondo arquitectónica y orbes de iluminación sutil -->
      <div class="pointer-events-none fixed inset-0 auth-grid opacity-45"></div>
      <div class="pointer-events-none fixed -left-28 -top-28 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl"></div>
      <div class="pointer-events-none fixed -bottom-32 -right-28 h-96 w-96 rounded-full bg-sky-200/30 blur-3xl"></div>

      <!-- Skyline de edificios corporativos en fondo -->
      <svg
        class="pointer-events-none fixed inset-x-0 bottom-0 z-0 h-64 w-full select-none opacity-40"
        viewBox="0 0 1200 300"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
      >
        <defs>
          <pattern id="ventanasClientShell" width="14" height="18" patternUnits="userSpaceOnUse">
            <rect x="3" y="4" width="6" height="8" fill="#ffffff" opacity=".85" />
          </pattern>
          <g id="edificiosClientShell">
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
          <clipPath id="recorteClientShell"><use href="#edificiosClientShell" /></clipPath>
        </defs>

        <use href="#edificiosClientShell" fill="#cbd5e1" opacity=".55" />
        <rect width="1200" height="300" fill="url(#ventanasClientShell)" clip-path="url(#recorteClientShell)" opacity=".65" />

        <g fill="#bfdbfe" opacity=".7">
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

      <!-- Barra superior con efecto glassmorphism -->
      <header class="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-md shadow-xs">
        <div class="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <a routerLink="/tienda" class="flex items-center gap-2.5 text-slate-950 transition hover:opacity-90">
            <app-logo size="sm" />
            <span class="text-xl font-black tracking-tight">Firmeza<span class="text-blue-600">.</span></span>
          </a>

          <nav class="ml-6 hidden items-center gap-1.5 sm:flex" aria-label="Navegación del cliente">
            <a
              routerLink="/tienda"
              routerLinkActive="bg-blue-50 text-blue-700 shadow-2xs font-black"
              class="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
              </svg>
              Catálogo
            </a>
            <a
              routerLink="/carrito"
              routerLinkActive="bg-blue-50 text-blue-700 shadow-2xs font-black"
              class="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <app-icon name="cart" [size]="15" />
              Carrito
              @if (cart.count() > 0) {
                <span class="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-black text-white shadow-xs">{{ cart.count() }}</span>
              }
            </a>
            <a
              routerLink="/mis-compras"
              routerLinkActive="bg-blue-50 text-blue-700 shadow-2xs font-black"
              class="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <app-icon name="receipt" [size]="15" />
              Mis compras
            </a>
          </nav>

          <div class="ml-auto flex items-center gap-3">
            @if (authService.getUser(); as user) {
              <div class="hidden items-center gap-2 sm:flex">
                <span class="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 font-black text-xs text-blue-700 ring-1 ring-blue-200">
                  {{ user.fullName.charAt(0).toUpperCase() }}
                </span>
                <div class="text-left">
                  <p class="text-xs font-black text-slate-900 leading-tight">{{ user.fullName }}</p>
                  <p class="text-[10px] font-semibold text-slate-400">Cliente registrado</p>
                </div>
              </div>
            }
            <a
              routerLink="/carrito"
              class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-600 shadow-xs sm:hidden"
            >
              <app-icon name="cart" [size]="16" />
              @if (cart.count() > 0) {
                <span class="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-black text-white">{{ cart.count() }}</span>
              }
            </a>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
              (click)="logout()"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-3.5 w-3.5 text-slate-400">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Salir</span>
            </button>
          </div>
        </div>
      </header>

      <!-- Contenedor central -->
      <main class="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <router-outlet />
      </main>

      <!-- Pie de página con seguridad y datos empresariales -->
      <footer class="relative z-10 border-t border-slate-200/80 bg-white/80 backdrop-blur-md py-6 text-center text-xs text-slate-500">
        <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <p>© {{ year }} Firmeza · Materiales de Construcción y Ferretería. Todos los derechos reservados.</p>
          <div class="flex items-center gap-1.5 text-slate-500">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-3.5 w-3.5 text-emerald-600">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <span>Conexión segura TLS 1.3 · Compra directa sin intermediarios</span>
          </div>
        </div>
      </footer>
    </div>
  `
})
export class ClientShellComponent {
  protected readonly authService = inject(AuthService);
  protected readonly cart = inject(CartService);
  private readonly router = inject(Router);

  protected readonly year = new Date().getFullYear();

  protected logout(): void {
    this.cart.clear();
    this.authService.logout();
  }
}