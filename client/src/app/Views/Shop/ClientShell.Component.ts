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
    <div class="flex min-h-screen flex-col bg-slate-50">
      <header class="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-lg">
        <div class="mx-auto flex h-16 max-w-6xl items-center gap-3 px-5 lg:px-8">
          <a routerLink="/tienda" class="flex items-center gap-2 text-slate-950">
            <app-logo size="sm" />
            <span class="text-lg font-black tracking-tight">Firmeza<span class="text-blue-500">.</span></span>
          </a>

          <nav class="ml-6 hidden items-center gap-1 sm:flex" aria-label="Navegación del cliente">
            <a
              routerLink="/tienda"
              routerLinkActive="bg-slate-100 text-slate-950"
              class="rounded-lg px-3 py-2 text-sm font-bold text-slate-600 transition"
            >
              Catálogo
            </a>
            <a
              routerLink="/carrito"
              routerLinkActive="bg-slate-100 text-slate-950"
              class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-slate-600 transition"
            >
              <app-icon name="cart" [size]="15" />
              Carrito
              @if (cart.count() > 0) {
                <span class="rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-black text-white">{{ cart.count() }}</span>
              }
            </a>
            <a
              routerLink="/mis-compras"
              routerLinkActive="bg-slate-100 text-slate-950"
              class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-slate-600 transition"
            >
              <app-icon name="receipt" [size]="15" />
              Mis compras
            </a>
          </nav>

          <div class="ml-auto flex items-center gap-3">
            @if (authService.getUser(); as user) {
              <span class="hidden text-sm font-bold text-slate-700 sm:block">{{ user.fullName }}</span>
            }
            <a
              routerLink="/carrito"
              class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-600 sm:hidden"
            >
              <app-icon name="cart" [size]="16" />
              @if (cart.count() > 0) {
                <span class="rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-black text-white">{{ cart.count() }}</span>
              }
            </a>
            <button
              type="button"
              class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-rose-50 hover:text-rose-600"
              (click)="logout()"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main class="mx-auto w-full max-w-6xl flex-1 px-5 py-8 lg:px-8">
        <router-outlet />
      </main>

      <footer class="border-t border-slate-200 bg-white px-5 py-6 text-center text-xs text-slate-500">
        Firmeza · Compra de materiales sin intermediarios
      </footer>
    </div>
  `
})
export class ClientShellComponent {
  protected readonly authService = inject(AuthService);
  protected readonly cart = inject(CartService);
  private readonly router = inject(Router);

  protected logout(): void {
    this.cart.clear();
    this.authService.logout();
  }
}