import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { toApiError } from '../../Services/Api.Service';
import { ConfirmService } from '../../Services/confirm.service';
import { ImportsService, ToastService } from '../../Services/imports.service';
import { Sale, SalesService } from '../../Services/sales.service';
import { IconComponent } from '../Shared/Icon.Component';

@Component({
  selector: 'app-sale-detail',
  imports: [IconComponent, RouterLink, CurrencyPipe, DatePipe],
  template: `
    <div class="mx-auto max-w-4xl">
      @if (errorMessage(); as message) {
        <div class="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-800">{{ message }}</div>
      }

      @if (loading()) {
        <div class="mt-8 flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-20 shadow-sm">
          <svg viewBox="0 0 24 24" fill="none" class="h-8 w-8 animate-spin text-blue-500">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-25" />
            <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
          </svg>
          <span class="ml-3 text-sm font-semibold text-slate-500">Cargando venta…</span>
        </div>
      }

      @if (sale(); as current) {
        <div class="flex items-center justify-between">
          <a routerLink="/ventas" class="text-sm font-bold text-blue-600 hover:text-blue-500">← Volver a ventas</a>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-slate-300"
              [disabled]="current.status === 'Delivered'"
              [title]="current.status === 'Delivered' ? 'No se puede eliminar una venta entregada' : 'Eliminar venta'"
              (click)="remove(current)"
            >
              Eliminar
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-500"
              (click)="downloadReceipt()"
            >
              Descargar recibo (PDF)
            </button>
          </div>
        </div>

        <div class="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="text-sm font-black uppercase tracking-[0.2em] text-blue-600">Comprobante de venta</p>
            <h1 class="mt-1 text-3xl font-black text-slate-950">{{ current.saleNumber }}</h1>
            <p class="mt-1 text-slate-500">{{ current.customerName }} · {{ current.saleDate | date: 'dd/MM/yyyy HH:mm' }}</p>
          </div>
          <span class="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold ring-1" [class]="salesService.statusClass(current.status)">
            <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true"></span>
            {{ salesService.statusLabel(current.status) }}
          </span>
        </div>

        <div class="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          <h3 class="text-xs font-black uppercase tracking-wider text-slate-400">Información del cliente</h3>
          <div class="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <span class="block text-xs text-slate-400">Nombre / Razón social:</span>
              <span class="font-bold text-slate-900">{{ current.customerName }}</span>
            </div>
            <div>
              <span class="block text-xs text-slate-400">Documento / NIT:</span>
              <span class="font-mono font-bold text-slate-900">{{ current.customerDocument }}</span>
            </div>
          </div>
        </div>

        <div class="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th class="px-6 py-4">Producto</th>
                  <th class="px-6 py-4">Código</th>
                  <th class="px-6 py-4 text-right">Cantidad</th>
                  <th class="px-6 py-4 text-right">Precio</th>
                  <th class="px-6 py-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (line of current.lines; track line.id) {
                  <tr>
                    <td class="px-6 py-4 font-bold text-slate-900">{{ line.productName }}</td>
                    <td class="px-6 py-4 font-mono text-xs text-slate-500">{{ line.productSku }}</td>
                    <td class="px-6 py-4 text-right">{{ line.quantity }}</td>
                    <td class="px-6 py-4 text-right">{{ line.unitPrice | currency: 'COP' }}</td>
                    <td class="px-6 py-4 text-right font-bold text-slate-900">{{ line.subtotal | currency: 'COP' }}</td>
                  </tr>
                }
              </tbody>
              <tfoot class="border-t border-slate-200 bg-slate-50/50">
                <tr>
                  <td colspan="4" class="px-6 py-3 text-right text-xs font-semibold text-slate-500">Subtotal (base):</td>
                  <td class="px-6 py-3 text-right text-sm font-bold text-slate-700">{{ subtotalBase() | currency: 'COP' }}</td>
                </tr>
                <tr>
                  <td colspan="4" class="px-6 py-3 text-right text-xs font-semibold text-slate-500">IVA (19%):</td>
                  <td class="px-6 py-3 text-right text-sm font-bold text-slate-700">{{ iva() | currency: 'COP' }}</td>
                </tr>
                <tr class="border-t border-slate-200">
                  <td colspan="4" class="px-6 py-4 text-right text-base font-black text-slate-900">Total a pagar:</td>
                  <td class="px-6 py-4 text-right text-2xl font-black text-blue-600">{{ current.total | currency: 'COP' }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      }
    </div>
  `
})
export class SaleDetailComponent implements OnInit {
  readonly id = input<string>();

  protected readonly salesService = inject(SalesService);
  private readonly importsService = inject(ImportsService);
  private readonly toastService = inject(ToastService);
  private readonly confirmService = inject(ConfirmService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly sale = signal<Sale | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly subtotalBase = computed(() => (this.sale()?.total ?? 0) / 1.19);
  protected readonly iva = computed(() => (this.sale()?.total ?? 0) - this.subtotalBase());

  ngOnInit(): void {
    const id = this.id();
    if (!id) return;

    this.loading.set(true);
    this.salesService.getById(id).subscribe({
      next: (sale) => {
        this.loading.set(false);
        this.sale.set(sale);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(toApiError(error).message);
      }
    });
  }

  protected async remove(sale: Sale): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Eliminar venta',
      message: `¿Eliminar la venta ${sale.saleNumber} de ${sale.customerName}? Se devolvera el stock de sus productos y esta accion no se puede deshacer.`
    });
    if (!confirmed) return;

    this.salesService.delete(sale.id).subscribe({
      next: () => {
        this.toastService.success('Venta eliminada.');
        this.router.navigate(['/ventas']);
      },
      error: (error) => this.toastService.error(toApiError(error).message)
    });
  }

  protected downloadReceipt(): void {
    const sale = this.sale();
    if (!sale) return;

    this.importsService.download(this.salesService.receiptUrl(sale.id), `recibo_${sale.saleNumber}.pdf`).subscribe({
      next: () => this.toastService.success('Recibo descargado.'),
      error: (error) => this.toastService.error(toApiError(error).message)
    });
  }
}
