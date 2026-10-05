import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toApiError } from '../../Services/Api.Service';
import { ConfirmService } from '../../Services/confirm.service';
import { ToastService } from '../../Services/imports.service';
import { SaleStatus, SaleSummary, SalesService } from '../../Services/sales.service';
import { IconComponent } from '../Shared/Icon.Component';

/**
 * Historial de compras del cliente.
 *
 * La API devuelve solo las ventas de la ficha del usuario autenticado, asi que
 * esta vista no necesita filtrar por cliente: el alcance lo pone el servidor a
 * partir del correo del token.
 */
@Component({
  selector: 'app-my-orders',
  imports: [RouterLink, CurrencyPipe, DatePipe, IconComponent],
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-sm font-black uppercase tracking-[0.2em] text-blue-600">Portal del cliente</p>
        <h1 class="mt-2 text-3xl font-black tracking-tight text-slate-950">Mis compras</h1>
        <p class="mt-2 text-slate-500">Sigue el estado de cada solicitud que enviaste.</p>
      </div>
      <a routerLink="/tienda" class="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-500">
        Ir al catálogo
      </a>
    </div>

    @if (errorMessage(); as message) {
      <div class="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-800">{{ message }}</div>
    }

    @if (loading()) {
      <div class="mt-6 flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-20 shadow-sm">
        <svg viewBox="0 0 24 24" fill="none" class="h-8 w-8 animate-spin text-blue-500">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-25" />
          <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
        </svg>
        <span class="ml-3 text-sm font-semibold text-slate-500">Cargando tus compras…</span>
      </div>
    }

    <div class="mt-6 space-y-4">
      @for (sale of sales(); track sale.id) {
        <article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="font-mono text-base font-black text-slate-950">{{ sale.saleNumber }}</h2>
                <span
                  class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ring-1"
                  [class]="salesService.statusClass(sale.status)"
                >
                  <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true"></span>
                  {{ salesService.statusLabel(sale.status) }}
                </span>
              </div>
              <p class="mt-1 text-xs text-slate-500">
                {{ sale.saleDate | date: 'dd/MM/yyyy HH:mm' }} · {{ sale.lineCount }}
                {{ sale.lineCount === 1 ? 'producto' : 'productos' }}
              </p>
            </div>
            <p class="text-xl font-black text-slate-950">{{ sale.total | currency: 'COP' }}</p>
          </div>

          <p class="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
            {{ nextStep(sale.status) }}
          </p>

          <div class="mt-4 flex flex-wrap items-center gap-3">
            <a
              [routerLink]="['/compras', sale.id]"
              class="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
            >
              Ver detalle
            </a>
            @if (sale.status === 'Delivered') {
              <a
                [href]="salesService.receiptUrl(sale.id)"
                class="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-600"
              >
                Descargar comprobante
              </a>
            }
            @if (sale.status === 'Pending') {
              <button
                type="button"
                class="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-rose-300 hover:text-rose-600"
                (click)="cancel(sale)"
              >
                Cancelar solicitud
              </button>
            }
          </div>
        </article>
      } @empty {
        @if (!loading()) {
          <div class="rounded-2xl border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
            <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
              <app-icon name="receipt" [size]="26" />
            </span>
            <p class="mt-4 text-sm font-bold text-slate-700">Todavía no tenés compras</p>
            <p class="mt-1 text-xs text-slate-400">Cuando envíes una solicitud aparecerá aquí con su estado.</p>
            <a routerLink="/tienda" class="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-500">
              Ver catálogo
            </a>
          </div>
        }
      }
    </div>

    @if (totalPages() > 1) {
      <div class="mt-6 flex items-center justify-between">
        <p class="text-xs font-semibold text-slate-500">Página {{ page() }} de {{ totalPages() }} · {{ totalCount() }} compras</p>
        <div class="flex gap-2">
          <button type="button" class="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 disabled:opacity-40" [disabled]="page() <= 1" (click)="goToPage(page() - 1)">
            Anterior
          </button>
          <button type="button" class="rounded-xl border border-slate-300 bg-white px-4 py-4 text-xs font-bold text-slate-700 disabled:opacity-40" [disabled]="page() >= totalPages()" (click)="goToPage(page() + 1)">
            Siguiente
          </button>
        </div>
      </div>
    }
  `
})
export class MyOrdersComponent implements OnInit {
  protected readonly salesService = inject(SalesService);
  private readonly confirmService = inject(ConfirmService);
  private readonly toastService = inject(ToastService);

  protected readonly sales = signal<SaleSummary[]>([]);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly page = signal(1);
  protected readonly totalPages = signal(0);
  protected readonly totalCount = signal(0);

  ngOnInit(): void {
    this.load();
  }

  /** Explica al cliente que sigue y quien lo hace. */
  protected nextStep(status: SaleStatus): string {
    switch (status) {
      case 'Pending':
        return 'Tu solicitud fue enviada y está pendiente de confirmación. Todavía no se ha descontado el stock: eso pasa cuando el administrador la confirma.';
      case 'Confirmed':
        return 'Tu solicitud fue confirmada. Estamos preparando la entrega de los materiales.';
      case 'Delivered':
        return 'Materiales entregados. Podés descargar el comprobante en PDF.';
      case 'Cancelled':
        return 'Esta solicitud fue cancelada. Contactanos si necesitas reactivarla.';
      default:
        return '';
    }
  }

  protected async cancel(sale: SaleSummary): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Cancelar solicitud',
      message: `¿Cancelar la solicitud ${sale.saleNumber}? Esta accion no se puede deshacer.`,
      confirmLabel: 'Cancelar solicitud'
    });
    if (!confirmed) return;

    this.salesService.cancelRequest(sale.id).subscribe({
      next: () => {
        this.toastService.success('Solicitud cancelada.');
        this.load();
      },
      error: (error) => this.toastService.error(toApiError(error).message)
    });
  }

  protected goToPage(page: number): void {
    this.page.set(page);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.salesService.list({ page: this.page(), pageSize: 10 }).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.sales.set(response.items);
        this.page.set(response.page);
        this.totalPages.set(response.totalPages);
        this.totalCount.set(response.totalCount);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(toApiError(error).message);
      }
    });
  }
}