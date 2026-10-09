import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { IconComponent } from '../Shared/Icon.Component';
import { toApiError } from '../../Services/Api.Service';
import { ConfirmService } from '../../Services/confirm.service';
import { ImportsService, ToastService } from '../../Services/imports.service';
import { SaleStatus, SaleSummary, SalesService } from '../../Services/sales.service';
import { AdminNotificationService } from '../../Services/admin-notification.service';

@Component({
  selector: 'app-sales',
  imports: [IconComponent, FormsModule, RouterLink, CurrencyPipe, DatePipe],
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-sm font-black uppercase tracking-[0.2em] text-blue-600">Movimiento comercial</p>
        <h1 class="mt-2 text-3xl font-black tracking-tight text-slate-950">Ventas</h1>
        <p class="mt-2 text-slate-500">Consulta las operaciones registradas y genera comprobantes.</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button type="button" class="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-emerald-500 hover:text-emerald-600" (click)="exportFile('excel')">
          <svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" class="h-4 w-4 text-emerald-600">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Exportar Excel
        </button>
        <button type="button" class="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-rose-500 hover:text-rose-600" (click)="exportFile('pdf')">
          <svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" class="h-4 w-4 text-rose-600">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          Exportar PDF
        </button>
        <a routerLink="/ventas/nueva" class="rounded-xl bg-blue-400 px-5 py-2.5 text-sm font-black text-slate-950 shadow-lg shadow-blue-100 transition hover:bg-blue-300">
          + Nueva venta
        </a>
      </div>
    </div>

    <form class="mt-8 flex flex-wrap gap-3" (ngSubmit)="search()">
      <input
        name="q"
        [(ngModel)]="queryText"
        placeholder="Buscar por número o cliente..."
        class="min-w-[240px] flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      />
      <select name="status" [ngModel]="status()" (ngModelChange)="onStatusChange($event)" class="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400">
        <option [ngValue]="null">Todos los estados</option>
        @for (option of statusOptions; track option.value) {
          <option [ngValue]="option.value">{{ option.label }}</option>
        }
      </select>
      <button type="submit" class="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800">Buscar</button>
    </form>

    @if (errorMessage(); as message) {
      <div class="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-800">{{ message }}</div>
    }

    <div class="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[750px] text-left text-sm">
          <thead class="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th class="px-6 py-4">Venta</th>
              <th class="px-6 py-4">Cliente</th>
              <th class="px-6 py-4">Fecha</th>
              <th class="px-6 py-4">Estado</th>
              <th class="px-6 py-4 text-right">Total</th>
              <th class="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @for (sale of sales(); track sale.id) {
              <tr
                class="transition border-l-4"
                [class]="sale.status === 'Pending'
                  ? 'border-l-amber-500 bg-amber-50/60 hover:bg-amber-100/60 font-medium'
                  : 'border-l-transparent hover:bg-blue-50/40'"
              >
                <td class="px-6 py-4 font-bold text-slate-900">
                  <div class="flex items-center gap-2">
                    <span>{{ sale.saleNumber }}</span>
                    @if (sale.status === 'Pending') {
                      <span class="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-800 ring-1 ring-amber-300">
                        <span class="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        Pendiente
                      </span>
                    }
                  </div>
                </td>
                <td class="px-6 py-4 text-slate-600">{{ sale.customerName }}</td>
                <td class="px-6 py-4 text-slate-500">{{ sale.saleDate | date: 'dd/MM/yyyy HH:mm' }}</td>
                <td class="px-6 py-4">
                  <span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1" [class]="salesService.statusClass(sale.status)">
                    <span class="h-1.5 w-1.5 rounded-full bg-current" [class.animate-pulse]="sale.status === 'Pending'" aria-hidden="true"></span>
                    {{ salesService.statusLabel(sale.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right font-bold text-slate-900">{{ sale.total | currency: 'COP' }}</td>
                <td class="px-6 py-4">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      title="Descargar recibo PDF"
                      class="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      (click)="downloadReceipt(sale)"
                    >
                      <app-icon name="receipt" [size]="16" label="Descargar recibo PDF" />
                    </button>
                    <a
                      [routerLink]="['/ventas', sale.id]"
                      title="Ver venta"
                      class="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                    >
                      <app-icon name="eye" [size]="16" label="Ver venta" />
                    </a>
                    <a
                      [routerLink]="['/ventas', sale.id, 'editar']"
                      title="Editar venta"
                      class="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600 disabled:pointer-events-none disabled:opacity-30"
                      [class.cursor-not-allowed]="!canEdit(sale)"
                      [attr.aria-disabled]="!canEdit(sale)"
                    >
                      <app-icon name="pencil" [size]="16" label="Editar venta" />
                    </a>
                    <button
                      type="button"
                      title="Eliminar venta"
                      class="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:pointer-events-none disabled:opacity-30"
                      [disabled]="!canDelete(sale)"
                      (click)="remove(sale)"
                    >
                      <app-icon name="trash" [size]="16" label="Eliminar venta" />
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="px-6 py-14 text-center text-slate-500">No hay ventas registradas.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    @if (totalPages() > 1) {
      <div class="mt-6 flex items-center justify-between">
        <p class="text-xs font-semibold text-slate-500">Página {{ page() }} de {{ totalPages() }} · {{ totalCount() }} registros</p>
        <div class="flex gap-2">
          <button type="button" class="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 disabled:opacity-40" [disabled]="page() <= 1" (click)="goToPage(page() - 1)">
            Anterior
          </button>
          <button type="button" class="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 disabled:opacity-40" [disabled]="page() >= totalPages()" (click)="goToPage(page() + 1)">
            Siguiente
          </button>
        </div>
      </div>
    }
  `
})
export class SalesComponent implements OnInit {
  protected readonly salesService = inject(SalesService);
  private readonly importsService = inject(ImportsService);
  private readonly toastService = inject(ToastService);
  private readonly confirmService = inject(ConfirmService);
  private readonly route = inject(ActivatedRoute);
  private readonly notificationService = inject(AdminNotificationService);

  protected readonly statusOptions: { value: SaleStatus; label: string }[] = [
    { value: 'Pending', label: 'Pendiente' },
    { value: 'Confirmed', label: 'Confirmada' },
    { value: 'Delivered', label: 'Entregada' },
    { value: 'Cancelled', label: 'Cancelada' }
  ];

  protected readonly sales = signal<SaleSummary[]>([]);
  protected queryText = '';
  protected readonly status = signal<SaleStatus | null>(null);
  protected readonly page = signal(1);
  protected readonly totalPages = signal(0);
  protected readonly totalCount = signal(0);
  protected readonly errorMessage = signal<string | null>(null);

  private alertSubscription?: Subscription;

  ngOnInit(): void {
    const statusParam = this.route.snapshot.queryParamMap.get('status') as SaleStatus | null;
    if (statusParam && this.statusOptions.some((opt) => opt.value === statusParam)) {
      this.status.set(statusParam);
    }
    this.notificationService.markSeen();
    this.load();

    this.alertSubscription = this.notificationService.newSaleAlert$.subscribe(() => {
      this.load();
    });
  }

  ngOnDestroy(): void {
    this.alertSubscription?.unsubscribe();
  }

  @HostListener('window:focus')
  onWindowFocus(): void {
    this.load();
  }

  protected search(): void {
    this.page.set(1);
    this.load();
  }

  protected onStatusChange(status: SaleStatus | null): void {
    this.status.set(status);
    this.search();
  }

  protected goToPage(page: number): void {
    this.page.set(page);
    this.load();
  }

  protected canDelete(sale: SaleSummary): boolean {
    return sale.status !== 'Delivered';
  }

  protected canEdit(sale: SaleSummary): boolean {
    return sale.status !== 'Delivered';
  }

  protected async remove(sale: SaleSummary): Promise<void> {
    if (sale.status === 'Delivered') {
      this.toastService.error('La venta ya fue entregada y no se puede eliminar.');
      return;
    }

    const confirmed = await this.confirmService.confirm({
      title: 'Eliminar venta',
      message: `¿Eliminar la venta ${sale.saleNumber} de ${sale.customerName}? Se devolvera el stock de sus productos y esta accion no se puede deshacer.`
    });
    if (!confirmed) return;

    this.salesService.delete(sale.id).subscribe({
      next: () => {
        this.notificationService.refresh();
        AdminNotificationService.broadcastStockChanged(sale.saleNumber, 'Deleted');
        this.toastService.success('Venta eliminada.');
        this.load();
      },
      error: (error) => this.toastService.error(toApiError(error).message)
    });
  }

  protected downloadReceipt(sale: SaleSummary): void {
    this.importsService.download(this.salesService.receiptUrl(sale.id), `recibo_${sale.saleNumber}.pdf`).subscribe({
      next: () => this.toastService.success('Recibo descargado.'),
      error: (error) => this.toastService.error(toApiError(error).message)
    });
  }

  protected exportFile(format: 'excel' | 'pdf'): void {
    const url = format === 'excel' ? this.salesService.exportExcelUrl() : this.salesService.exportPdfUrl();

    this.importsService.download(url, `ventas.${format === 'excel' ? 'xlsx' : 'pdf'}`).subscribe({
      next: () => this.toastService.success(`Ventas exportadas (${format.toUpperCase()}).`),
      error: (error) => this.toastService.error(toApiError(error).message)
    });
  }

  private load(): void {
    this.salesService
      .list({
        q: this.queryText.trim() || undefined,
        status: this.status(),
        page: this.page(),
        pageSize: 10
      })
      .subscribe({
        next: (response) => {
          this.sales.set(response.items);
          this.page.set(response.page);
          this.totalPages.set(response.totalPages);
          this.totalCount.set(response.totalCount);
        },
        error: (error) => this.errorMessage.set(toApiError(error).message)
      });
  }
}
