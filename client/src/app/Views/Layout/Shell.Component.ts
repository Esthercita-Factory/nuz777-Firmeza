import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../Services/auth.service';

interface NavItem {
  path: string;
  label: string;
  /** Path data (atributo d) de un icono de 24x24 trazo, estilo Feather/Lucide. */
  icon: string;
}

@Component({
  selector: 'app-logo',
  template: `
    <svg viewBox="0 0 48 48" [class]="size() === 'sm' ? 'h-8 w-8' : 'h-10 w-10'" aria-hidden="true">
      <rect width="48" height="48" rx="13" fill="#3b82f6" />
      <path d="M15 33V12h19v5H21v5h12v5H21v6z" fill="#ffffff" />
      <circle cx="39.5" cy="8.5" r="4.5" fill="#ffffff" />
    </svg>
  `
})
export class LogoComponent {
  readonly size = input<'sm' | 'md'>('md');
}

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LogoComponent],
  template: `
    <div class="flex min-h-screen flex-col">
      <aside
        class="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-white/60 bg-white/40 text-slate-700 shadow-xl shadow-slate-200/60 backdrop-blur-2xl transition-transform duration-300 lg:block"
        [class]="sidebarOpen() ? '' : '-translate-x-full'"
      >
        <div class="flex h-full flex-col px-5 py-6">
          <a routerLink="/dashboard" class="mb-10 flex items-center gap-3 px-2 text-slate-950">
            <app-logo />
            <span>
              <span class="block text-lg font-black tracking-tight">Firmeza</span>
              <span class="text-xs text-slate-500">Panel administrativo</span>
            </span>
          </a>

          <nav class="space-y-1" aria-label="Navegación principal">
            @for (item of navItems; track item.path) {
              <a
                [routerLink]="item.path"
                routerLinkActive="bg-white/70 text-slate-950"
                class="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition hover:bg-white/70 hover:text-slate-950"
              >
                <svg class="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                  <path [attr.d]="item.icon" />
                </svg>
                {{ item.label }}
              </a>
            }
          </nav>

          <div class="mt-auto border-t border-white/60 pt-5">
            <p class="truncate px-4 text-xs text-slate-500">{{ authService.getUser()?.email }}</p>
            <button
              type="button"
              class="mt-2 flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-blue-50 hover:text-blue-600"
              (click)="logout()"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      <button
        type="button"
        aria-label="Abrir menú lateral"
        class="fixed top-1/2 z-30 hidden -translate-y-1/2 items-center justify-center rounded-full bg-slate-950 p-3 text-white shadow-lg transition-all duration-300 hover:bg-blue-400 hover:text-slate-950 lg:inline-flex"
        [class]="sidebarOpen() ? 'left-72' : 'left-5'"
        (click)="toggleSidebar()"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <path d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div class="flex min-h-screen flex-col" [class]="sidebarOpen() ? 'lg:pl-72' : ''">
        <header class="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-lg">
          <div class="mx-auto flex h-16 max-w-7xl items-center gap-3 px-5 lg:px-8">
            <a routerLink="/dashboard" class="flex items-center gap-2 lg:hidden">
              <app-logo size="sm" />
              <span class="text-xl font-black tracking-tight text-slate-950">Firmeza<span class="text-blue-500">.</span></span>
            </a>

            <div class="hidden items-center gap-2.5 lg:flex">
              <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" class="h-5 w-5">
                  <path [attr.d]="currentNav()?.icon ?? navItems[0].icon" />
                </svg>
              </span>
              <span class="max-w-[240px] truncate text-sm font-black uppercase tracking-widest text-slate-700">{{ pageTitle() }}</span>
            </div>

            <div class="ml-auto flex items-center gap-3">
              <div class="flex items-center gap-3 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-4 shadow-sm">
                <img src="img/admin.png" alt="Admin" class="h-8 w-8 rounded-full object-cover" />
                <span class="hidden text-sm font-bold text-slate-700 sm:block">{{ authService.getUser()?.fullName }}</span>
                <span class="hidden rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-700 sm:block">Admin</span>
              </div>
              <button
                type="button"
                class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm lg:hidden"
                (click)="logout()"
              >
                Salir
              </button>
            </div>
          </div>
        </header>

        <main class="mx-auto w-full max-w-7xl flex-1 px-5 py-8 lg:px-8">
          <router-outlet />
        </main>

        <footer class="border-t border-slate-200 bg-white px-5 py-6 text-center text-xs text-slate-500 lg:px-8">
          Firmeza · Gestión de productos y clientes
        </footer>
      </div>
    </div>
  `
})
export class ShellComponent {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly navItems: NavItem[] = [
    {
      path: '/dashboard',
      label: 'Inicio',
      icon: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z'
    },
    {
      path: '/productos',
      label: 'Productos',
      icon: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0'
    },
    {
      path: '/clientes',
      label: 'Clientes',
      icon: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8'
    },
    {
      path: '/ventas',
      label: 'Ventas',
      icon: 'M2 3h2l2.4 11.4a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L21 7H6M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2M18 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2'
    },
    {
      path: '/carga-masiva',
      label: 'Carga Masiva',
      icon: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12'
    },
    {
      path: '/solicitudes',
      label: 'Solicitudes',
      icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M19 8v6M22 11h-6'
    }
  ];

  protected readonly sidebarOpen = signal(localStorage.getItem('firmeza-sidebar-open') === 'true');
  protected readonly currentNav = signal<NavItem | null>(null);
  protected readonly pageTitle = computed(() => this.currentNav()?.label ?? 'Panel');

  constructor() {
    this.router.events.subscribe(() => this.currentNav.set(this.navFor(this.router.url)));
    this.currentNav.set(this.navFor(this.router.url));
  }

  private navFor(url: string): NavItem | null {
    const path = url.split('?')[0];
    return this.navItems.find((item) => path.startsWith(item.path)) ?? null;
  }

  protected toggleSidebar(): void {
    const next = !this.sidebarOpen();
    this.sidebarOpen.set(next);
    localStorage.setItem('firmeza-sidebar-open', String(next));
  }

  protected logout(): void {
    this.authService.logout();
  }
}
