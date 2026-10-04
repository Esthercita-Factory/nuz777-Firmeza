import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toApiError } from '../../Services/Api.Service';
import { AuthService } from '../../Services/auth.service';
import { DashboardData, DashboardService } from '../../Services/dashboard.service';
import { SalesService } from '../../Services/sales.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, CurrencyPipe, DatePipe, DecimalPipe],
  template: `
    @if (errorMessage(); as message) {
      <div class="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-800">{{ message }}</div>
    }

    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-xs font-black uppercase tracking-[0.25em] text-blue-600">Resumen operativo</p>
        <h1 class="mt-2 text-3xl font-black tracking-tight text-slate-950">Buenos días, {{ authService.getUser()?.fullName }}</h1>
        <p class="mt-2 text-slate-500">Esto es lo que está pasando en tu negocio.</p>
      </div>
    </div>

    @if (data(); as dashboard) {
      <div class="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div class="relative min-w-0 overflow-hidden rounded-2xl bg-slate-950 p-6 text-white shadow-lg">
          <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-400 text-slate-950">
            <svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" class="h-5 w-5">
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
            </svg>
          </div>
          <p class="mt-5 text-sm text-slate-400">Productos activos</p>
          <p class="mt-1 break-words text-3xl font-black tabular-nums">{{ dashboard.activeProductCount | number }}</p>
          <a routerLink="/productos" class="mt-5 inline-flex items-center gap-1 text-xs font-bold text-blue-400 transition hover:gap-2">
            Ver catálogo <span aria-hidden="true">→</span>
          </a>
        </div>

        <div class="min-w-0 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
            <svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" class="h-5 w-5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <p class="mt-5 text-sm text-slate-500">Clientes activos</p>
          <p class="mt-1 break-words text-3xl font-black tabular-nums text-slate-950">{{ dashboard.activeCustomerCount | number }}</p>
          <a routerLink="/clientes" class="mt-5 inline-flex items-center gap-1 text-xs font-bold text-sky-600 transition hover:gap-2">
            Ver clientes <span aria-hidden="true">→</span>
          </a>
        </div>

        <div class="min-w-0 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" class="h-5 w-5">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path d="M2 10h20" />
              <path d="m6 15 4-4 3 2 5-5" />
            </svg>
          </div>
          <p class="mt-5 text-sm text-slate-500">Ventas registradas</p>
          <p class="mt-1 break-words text-3xl font-black tabular-nums text-slate-950">{{ dashboard.saleCount | number }}</p>
          <a routerLink="/ventas" class="mt-5 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 transition hover:gap-2">
            Ver ventas <span aria-hidden="true">→</span>
          </a>
        </div>

        <div class="min-w-0 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-6">
          <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm ring-1 ring-blue-200">
            <svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" class="h-5 w-5">
              <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <p class="mt-5 text-sm text-blue-800">Ventas acumuladas</p>
          <p class="mt-1 break-words text-2xl font-black tabular-nums text-slate-950">{{ dashboard.salesTotal | currency: 'COP' }}</p>
        </div>
      </div>

      <div class="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
          <h2 class="flex items-center gap-2 font-black text-slate-950">
            <svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" class="h-5 w-5 text-blue-500">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            Ventas recientes
          </h2>
          <a routerLink="/ventas" class="inline-flex items-center gap-1 text-sm font-bold text-blue-600 transition hover:gap-2">
            Ver todas <span aria-hidden="true">→</span>
          </a>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full min-w-[650px] text-left text-sm">
            <thead class="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th class="px-6 py-4">Venta</th>
                <th class="px-6 py-4">Cliente</th>
                <th class="px-6 py-4">Fecha</th>
                <th class="px-6 py-4">Estado</th>
                <th class="px-6 py-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (sale of dashboard.recentSales; track sale.id) {
                <tr class="transition hover:bg-slate-50">
                  <td class="px-6 py-4 font-bold text-slate-900">{{ sale.saleNumber }}</td>
                  <td class="px-6 py-4 text-slate-600">{{ sale.customerName }}</td>
                  <td class="px-6 py-4 text-slate-500">{{ sale.saleDate | date: 'dd/MM/yyyy' }}</td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1" [class]="salesService.statusClass(sale.status)">
                      <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true"></span>
                      {{ salesService.statusLabel(sale.status) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right font-bold text-slate-900">{{ sale.total | currency: 'COP' }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="px-6 py-16 text-center text-sm font-semibold text-slate-500">
                    Todavía no hay ventas registradas.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  `
})
export class DashboardComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  protected readonly salesService = inject(SalesService);
  private readonly dashboardService = inject(DashboardService);

  protected readonly data = signal<DashboardData | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.dashboardService.getDashboardData().subscribe({
      next: (dashboard) => this.data.set(dashboard),
      error: (error) => this.errorMessage.set(toApiError(error).message)
    });
  }
}
