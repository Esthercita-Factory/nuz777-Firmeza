import { Component, HostListener, OnInit, OnDestroy, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../Services/auth.service';
import { AdminNotificationService } from '../../Services/admin-notification.service';
import { SalesService, SaleSummary } from '../../Services/sales.service';
import { CustomerRequestsService, CustomerSignup } from '../../Services/customer-requests.service';

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

import { ThemeToggleComponent } from '../Shared/ThemeToggle.Component';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LogoComponent, CurrencyPipe, DatePipe, ThemeToggleComponent],
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
                routerLinkActive="active-nav bg-white/70 text-slate-950 font-bold"
                class="group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition hover:bg-white/70 hover:text-slate-950"
              >
                <svg class="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                  <path [attr.d]="item.icon" />
                </svg>
                <span class="flex-1">{{ item.label }}</span>
                @if (item.path === '/ventas' && notificationService.pendingSaleCount() > 0) {
                  <span
                    class="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-black text-white shadow-sm"
                    title="Solicitudes de producto pendientes"
                  >
                    {{ notificationService.pendingSaleCount() }}
                  </span>
                }
                @if (item.path === '/solicitudes' && pendingCustomerCount() > 0) {
                  <span
                    class="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-black text-white shadow-sm"
                    title="Solicitudes de registro pendientes"
                  >
                    {{ pendingCustomerCount() }}
                  </span>
                }
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
              <!-- Selector de Modo Oscuro / Claro -->
              <app-theme-toggle size="sm" />

              <!-- Campanita con Menú de Vista Previa -->
              <div class="relative notification-dropdown-container">
                <button
                  type="button"
                  id="notifications-bell-btn"
                  aria-label="Notificaciones"
                  [attr.aria-expanded]="notificationsOpen()"
                  aria-haspopup="true"
                  class="relative flex h-10 w-10 items-center justify-center rounded-xl border transition shadow-sm"
                  [class]="notificationsOpen()
                    ? 'border-blue-500 bg-blue-50 text-blue-600 ring-2 ring-blue-100'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-400 hover:text-blue-600'"
                  (click)="toggleNotifications($event)"
                  title="Ver vista previa de notificaciones"
                >
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  @if (totalNotificationsCount() > 0) {
                    <span class="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-black text-white shadow-sm ring-2 ring-white animate-pulse">
                      {{ totalNotificationsCount() }}
                    </span>
                  }
                </button>

                <!-- Vista previa de Notificaciones (Dropdown Panel) -->
                @if (notificationsOpen()) {
                  <div
                    class="absolute right-0 top-full mt-2.5 w-84 sm:w-96 rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/15 z-50 overflow-hidden"
                    (click)="$event.stopPropagation()"
                  >
                    <!-- Cabecera del Panel -->
                    <div class="border-b border-slate-100 bg-slate-50/90 px-4 py-3 sm:px-5">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2.5">
                          <span class="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                            <svg class="h-4.5 w-4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                          </span>
                          <div>
                            <h3 class="text-xs font-black uppercase tracking-wider text-slate-900">Notificaciones</h3>
                            <p class="text-[11px] text-slate-500 font-medium">
                              @if (totalNotificationsCount() > 0) {
                                {{ totalNotificationsCount() }} pendientes de atención
                              } @else {
                                Todo al día
                              }
                            </p>
                          </div>
                        </div>
                        <div class="flex items-center gap-1.5">
                          @if (loadingNotifications()) {
                            <span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" title="Actualizando..."></span>
                          }
                          <button
                            type="button"
                            class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                            title="Cerrar vista previa"
                            (click)="closeNotifications()"
                          >
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                              <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <!-- Selector de pestañas: Pedidos vs Solicitudes de Clientes -->
                      <div class="mt-3 flex rounded-xl bg-slate-200/70 p-1 text-xs font-bold text-slate-600">
                        <button
                          type="button"
                          class="flex-1 rounded-lg py-1.5 text-center transition flex items-center justify-center gap-1.5"
                          [class]="activeTab() === 'sales' ? 'bg-white text-slate-950 shadow-sm' : 'hover:text-slate-950'"
                          (click)="activeTab.set('sales')"
                        >
                          <span>Pedidos</span>
                          @if (notificationService.pendingSaleCount() > 0) {
                            <span class="rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] font-black text-white">
                              {{ notificationService.pendingSaleCount() }}
                            </span>
                          }
                        </button>
                        <button
                          type="button"
                          class="flex-1 rounded-lg py-1.5 text-center transition flex items-center justify-center gap-1.5"
                          [class]="activeTab() === 'customers' ? 'bg-white text-slate-950 shadow-sm' : 'hover:text-slate-950'"
                          (click)="activeTab.set('customers')"
                        >
                          <span>Clientes</span>
                          @if (pendingCustomerCount() > 0) {
                            <span class="rounded-full bg-blue-600 px-1.5 py-0.2 text-[10px] font-black text-white">
                              {{ pendingCustomerCount() }}
                            </span>
                          }
                        </button>
                      </div>
                    </div>

                    <!-- Lista de Ítems en Vista Previa -->
                    <div class="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      @if (activeTab() === 'sales') {
                        @if (pendingSales().length === 0) {
                          <div class="px-5 py-8 text-center">
                            <div class="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                              <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <p class="mt-2 text-xs font-bold text-slate-900">Todo al día</p>
                            <p class="mt-0.5 text-[11px] text-slate-500">No hay ventas pendientes de confirmación.</p>
                          </div>
                        } @else {
                          @for (sale of pendingSales(); track sale.id) {
                            <a
                              [routerLink]="['/ventas', sale.id]"
                              (click)="closeNotifications()"
                              class="group block px-4 py-3 transition hover:bg-blue-50/60"
                            >
                              <div class="flex items-start justify-between gap-3">
                                <div class="min-w-0 flex-1">
                                  <div class="flex items-center gap-2">
                                    <span class="font-mono text-xs font-black text-slate-900 group-hover:text-blue-600">
                                      {{ sale.saleNumber }}
                                    </span>
                                    <span class="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                                      Pendiente
                                    </span>
                                  </div>
                                  <p class="mt-1 truncate text-xs font-bold text-slate-800">
                                    {{ sale.customerName }}
                                  </p>
                                  <div class="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                                    <span>{{ sale.saleDate | date:'dd/MM/yyyy HH:mm' }}</span>
                                    <span>·</span>
                                    <span>{{ sale.lineCount }} {{ sale.lineCount === 1 ? 'ítem' : 'ítems' }}</span>
                                  </div>
                                </div>
                                <div class="text-right shrink-0">
                                  <span class="text-xs font-black text-slate-950">
                                    {{ sale.total | currency:'COP' }}
                                  </span>
                                  <span class="mt-2 block text-[11px] font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                                    Revisar →
                                  </span>
                                </div>
                              </div>
                            </a>
                          }
                        }
                      } @else {
                        @if (pendingCustomerSignups().length === 0) {
                          <div class="px-5 py-8 text-center">
                            <div class="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                              <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <p class="mt-2 text-xs font-bold text-slate-900">Sin solicitudes</p>
                            <p class="mt-0.5 text-[11px] text-slate-500">No hay clientes esperando aprobación de cuenta.</p>
                          </div>
                        } @else {
                          @for (req of pendingCustomerSignups(); track req.id) {
                            <a
                              routerLink="/solicitudes"
                              (click)="closeNotifications()"
                              class="group block px-4 py-3 transition hover:bg-blue-50/60"
                            >
                              <div class="flex items-start justify-between gap-3">
                                <div class="min-w-0 flex-1">
                                  <div class="flex items-center gap-2">
                                    <span class="text-xs font-black text-slate-900 group-hover:text-blue-600 truncate">
                                      {{ req.fullName }}
                                    </span>
                                  </div>
                                  <p class="mt-0.5 text-[11px] text-slate-600 truncate">
                                    Doc: {{ req.document }} · {{ req.email }}
                                  </p>
                                  <span class="mt-1 block text-[10px] text-slate-400">
                                    Solicitud: {{ req.createdAt | date:'dd/MM/yyyy HH:mm' }}
                                  </span>
                                </div>
                                <span class="text-[11px] font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform shrink-0">
                                  Aprobar →
                                </span>
                              </div>
                            </a>
                          }
                        }
                      }
                    </div>

                    <!-- Pie del Panel -->
                    <div class="border-t border-slate-100 bg-slate-50/80 px-4 py-2.5 text-center">
                      @if (activeTab() === 'sales') {
                        <a
                          routerLink="/ventas"
                          [queryParams]="{ status: 'Pending' }"
                          (click)="closeNotifications()"
                          class="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition"
                        >
                          <span>Ver todas las ventas pendientes</span>
                          <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </a>
                      } @else {
                        <a
                          routerLink="/solicitudes"
                          (click)="closeNotifications()"
                          class="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition"
                        >
                          <span>Gestionar solicitudes de clientes</span>
                          <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </a>
                      }
                    </div>
                  </div>
                }
              </div>

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
export class ShellComponent implements OnInit, OnDestroy {
  protected readonly authService = inject(AuthService);
  protected readonly notificationService = inject(AdminNotificationService);
  private readonly salesService = inject(SalesService);
  private readonly customerRequestsService = inject(CustomerRequestsService);
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

  // Estado del menú desplegable de notificaciones
  protected readonly notificationsOpen = signal<boolean>(false);
  protected readonly activeTab = signal<'sales' | 'customers'>('sales');
  protected readonly pendingSales = signal<SaleSummary[]>([]);
  protected readonly pendingCustomerSignups = signal<CustomerSignup[]>([]);
  protected readonly pendingCustomerCount = signal<number>(0);
  protected readonly loadingNotifications = signal<boolean>(false);

  protected readonly totalNotificationsCount = computed(() =>
    this.notificationService.pendingSaleCount() + this.pendingCustomerCount()
  );

  private alertSub?: Subscription;
  private stockSub?: Subscription;

  constructor() {
    this.router.events.subscribe(() => this.currentNav.set(this.navFor(this.router.url)));
    this.currentNav.set(this.navFor(this.router.url));
  }

  ngOnInit(): void {
    this.notificationService.refresh();
    this.loadNotificationsPreview();

    // Reaccionar inmediatamente cuando entra una nueva venta o cambia el inventario
    this.alertSub = this.notificationService.newSaleAlert$.subscribe(() => {
      this.loadNotificationsPreview();
    });

    this.stockSub = this.notificationService.stockOrSaleChanged$.subscribe(() => {
      this.loadNotificationsPreview();
    });
  }

  ngOnDestroy(): void {
    this.alertSub?.unsubscribe();
    this.stockSub?.unsubscribe();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.notificationsOpen()) {
      const target = event.target as HTMLElement | null;
      if (target && !target.closest('.notification-dropdown-container')) {
        this.notificationsOpen.set(false);
      }
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.notificationsOpen.set(false);
  }

  protected toggleNotifications(event: MouseEvent): void {
    event.stopPropagation();
    const next = !this.notificationsOpen();
    this.notificationsOpen.set(next);
    if (next) {
      this.loadNotificationsPreview();
    }
  }

  protected closeNotifications(): void {
    this.notificationsOpen.set(false);
  }

  protected loadNotificationsPreview(): void {
    if (!this.authService.isAuthenticated() || !this.authService.isAdministrator()) {
      return;
    }

    this.loadingNotifications.set(true);

    // Cargar ventas pendientes
    this.salesService.list({ status: 'Pending', pageSize: 6 }).subscribe({
      next: (res) => {
        this.pendingSales.set(res.items);
        this.loadingNotifications.set(false);
      },
      error: () => {
        this.loadingNotifications.set(false);
      }
    });

    // Cargar solicitudes de registro de clientes
    this.customerRequestsService.list('Pending', undefined, 1, 6).subscribe({
      next: (res) => {
        this.pendingCustomerSignups.set(res.items);
        this.pendingCustomerCount.set(res.totalCount);
      },
      error: () => {}
    });
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
    this.notificationService.reset();
    this.authService.logout();
  }
}
