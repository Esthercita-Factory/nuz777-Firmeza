import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { toApiError } from '../../Services/Api.Service';
import { Customer, CustomersService } from '../../Services/customers.service';
import { ImportsService, ToastService } from '../../Services/imports.service';
import { Product, ProductsService } from '../../Services/products.service';
import { SaleLineRequest, SaleStatus, SalesService } from '../../Services/sales.service';

interface SaleLineDraft {
  key: number;
  productId: string;
  quantity: number;
  unitPrice: number;
}

const IVA_RATE = 0.19;

@Component({
  selector: 'app-sale-form',
  imports: [FormsModule, RouterLink, CurrencyPipe],
  template: `
    <div class="mx-auto max-w-4xl">
      <a routerLink="/ventas" class="text-sm font-bold text-blue-600 hover:text-blue-500">← Volver a ventas</a>

      <h1 class="mt-4 text-3xl font-black text-slate-950">Registrar nueva venta</h1>
      <p class="mt-1 text-slate-500">Selecciona el cliente y los productos. El recibo PDF se genera automáticamente.</p>

      @if (errorMessage(); as message) {
        <div class="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-800">{{ message }}</div>
      }

      <form class="mt-8 space-y-8" (ngSubmit)="onSubmit()">
        <section class="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <h2 class="text-base font-black text-slate-950">1. Datos del cliente</h2>

          <div class="mt-5">
            <label for="customerId" class="block text-xs font-bold uppercase tracking-wider text-slate-700">Cliente *</label>
            <select
              id="customerId"
              name="customerId"
              [(ngModel)]="customerId"
              class="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              required
            >
              <option [ngValue]="null">-- Selecciona un cliente --</option>
              @for (customer of customers(); track customer.id) {
                <option [ngValue]="customer.id">{{ customer.document }} · {{ customer.fullName }}</option>
              }
            </select>
            @if (fieldError('customerId'); as message) {
              <p class="mt-1 text-xs text-rose-600">{{ message }}</p>
            }
          </div>

          <div class="mt-5">
            <label for="status" class="block text-xs font-bold uppercase tracking-wider text-slate-700">Estado</label>
            <select
              id="status"
              name="status"
              [(ngModel)]="status"
              class="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              <option [ngValue]="null">Pendiente (por defecto)</option>
              @for (option of statusOptions; track option.value) {
                <option [ngValue]="option.value">{{ option.label }}</option>
              }
            </select>
          </div>
        </section>

        <section class="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-base font-black text-slate-950">2. Productos y materiales</h2>
              <p class="mt-1 text-xs text-slate-500">Agrega los ítems que conforman la orden de venta.</p>
            </div>
            <button type="button" class="rounded-xl bg-blue-100 px-4 py-2 text-xs font-bold text-blue-800 transition hover:bg-blue-200" (click)="addLine()">
              + Agregar producto
            </button>
          </div>

          <div class="mt-6 overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th class="px-4 py-3">Producto</th>
                  <th class="px-4 py-3 text-center">Disponible</th>
                  <th class="px-4 py-3 text-center">Cantidad</th>
                  <th class="px-4 py-3 text-right">Precio unitario</th>
                  <th class="px-4 py-3 text-right">Subtotal</th>
                  <th class="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium">
                @for (line of lines(); track line.key) {
                  <tr>
                    <td class="px-4 py-3">
                      <select
                        class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-blue-400"
                        [ngModel]="line.productId"
                        [ngModelOptions]="{ standalone: true }"
                        (ngModelChange)="onProductChange(line, $event)"
                      >
                        <option [ngValue]="''">-- Elegir producto --</option>
                        @for (product of products(); track product.id) {
                          <option [ngValue]="product.id">[{{ product.sku }}] {{ product.name }} ({{ product.stock }} {{ product.unit }})</option>
                        }
                      </select>
                    </td>
                    <td class="px-4 py-3 text-center font-mono text-xs text-slate-500">{{ stockFor(line.productId) ?? '-' }}</td>
                    <td class="px-4 py-3 text-center">
                      <input
                        type="number"
                        min="1"
                        class="w-20 rounded-lg border border-slate-300 px-2.5 py-1.5 text-center text-xs outline-none focus:border-blue-400"
                        [ngModel]="line.quantity"
                        [ngModelOptions]="{ standalone: true }"
                        (ngModelChange)="onQuantityChange(line, $event)"
                      />
                    </td>
                    <td class="px-4 py-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        class="w-28 rounded-lg border border-slate-300 px-2.5 py-1.5 text-right text-xs outline-none focus:border-blue-400"
                        [ngModel]="line.unitPrice"
                        [ngModelOptions]="{ standalone: true }"
                        (ngModelChange)="onPriceChange(line, $event)"
                      />
                    </td>
                    <td class="px-4 py-3 text-right font-bold text-slate-900">{{ line.quantity * line.unitPrice | currency: 'COP' }}</td>
                    <td class="px-4 py-3 text-center">
                      <button type="button" aria-label="Quitar línea" class="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600" (click)="removeLine(line)">
                        ✕
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="py-10 text-center text-xs text-slate-400">Agrega productos para comenzar la venta.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="mt-8 border-t border-slate-100 pt-6">
            <div class="ml-auto max-w-xs space-y-2 text-sm">
              <div class="flex justify-between text-slate-600">
                <span>Subtotal (base):</span>
                <span class="font-bold text-slate-900">{{ subtotalBase() | currency: 'COP' }}</span>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>IVA (19% inc.):</span>
                <span class="font-bold text-slate-900">{{ iva() | currency: 'COP' }}</span>
              </div>
              <div class="flex justify-between border-t border-slate-200 pt-2 text-base font-black text-slate-950">
                <span>Total a pagar:</span>
                <span class="text-xl text-blue-600">{{ total() | currency: 'COP' }}</span>
              </div>
            </div>
          </div>
        </section>

        <div class="flex justify-end gap-3">
          <a routerLink="/ventas" class="rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 shadow-sm">Cancelar</a>
          <button
            type="submit"
            class="rounded-xl bg-slate-950 px-8 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-blue-500 hover:text-slate-950 disabled:opacity-60"
            [disabled]="saving()"
          >
            Registrar venta y generar recibo PDF
          </button>
        </div>
      </form>
    </div>
  `
})
export class SaleFormComponent implements OnInit {
  private readonly customersService = inject(CustomersService);
  private readonly productsService = inject(ProductsService);
  private readonly salesService = inject(SalesService);
  private readonly importsService = inject(ImportsService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly statusOptions: { value: SaleStatus; label: string }[] = [
    { value: 'Pending', label: 'Pendiente' },
    { value: 'Confirmed', label: 'Confirmada' },
    { value: 'Delivered', label: 'Entregada' },
    { value: 'Cancelled', label: 'Cancelada' }
  ];

  protected customerId: string | null = null;
  protected status: SaleStatus | null = null;

  protected readonly customers = signal<Customer[]>([]);
  protected readonly products = signal<Product[]>([]);
  protected readonly lines = signal<SaleLineDraft[]>([]);
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly fieldErrors = signal<Record<string, string>>({});

  private nextKey = 1;

  protected readonly total = computed(() => this.lines().reduce((sum, line) => sum + line.quantity * line.unitPrice, 0));
  protected readonly subtotalBase = computed(() => this.total() / (1 + IVA_RATE));
  protected readonly iva = computed(() => this.total() - this.subtotalBase());

  ngOnInit(): void {
    this.customersService.activeOptions().subscribe({
      next: (customers) => this.customers.set(customers),
      error: (error) => this.errorMessage.set(toApiError(error).message)
    });

    this.productsService.list({ onlyActive: true, pageSize: 100 }).subscribe({
      next: (response) => this.products.set(response.items),
      error: (error) => this.errorMessage.set(toApiError(error).message)
    });

    this.addLine();
  }

  protected addLine(): void {
    this.lines.update((lines) => [...lines, { key: this.nextKey++, productId: '', quantity: 1, unitPrice: 0 }]);
  }

  protected removeLine(line: SaleLineDraft): void {
    this.lines.update((lines) => lines.filter((item) => item.key !== line.key));
  }

  protected onProductChange(line: SaleLineDraft, productId: string): void {
    const product = this.products().find((item) => item.id === productId);
    this.update(line.key, { productId, unitPrice: product?.price ?? 0 });
  }

  protected onQuantityChange(line: SaleLineDraft, value: unknown): void {
    this.update(line.key, { quantity: Math.max(1, Number(value) || 1) });
  }

  protected onPriceChange(line: SaleLineDraft, value: unknown): void {
    this.update(line.key, { unitPrice: Number(value) || 0 });
  }

  protected stockFor(productId: string): number | null {
    return this.products().find((item) => item.id === productId)?.stock ?? null;
  }

  protected fieldError(field: string): string | null {
    return this.fieldErrors()[field] ?? null;
  }

  protected onSubmit(): void {
    if (this.saving()) return;

    const validLines = this.lines().filter((line) => !!line.productId && line.quantity > 0 && line.unitPrice > 0);
    if (!this.customerId || validLines.length === 0) {
      this.errorMessage.set('Selecciona un cliente y al menos un producto con cantidad y precio.');
      return;
    }

    this.errorMessage.set(null);
    this.fieldErrors.set({});
    this.saving.set(true);

    const lines: SaleLineRequest[] = validLines.map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
      unitPrice: line.unitPrice
    }));

    this.salesService.create({ customerId: this.customerId, status: this.status, lines }).subscribe({
      next: (sale) => {
        this.toastService.success(`Venta ${sale.saleNumber} registrada.`);
        this.importsService.download(this.salesService.receiptUrl(sale.id), `recibo_${sale.saleNumber}.pdf`).subscribe();
        this.router.navigate(['/ventas', sale.id]);
      },
      error: (error) => {
        const apiError = toApiError(error);
        this.errorMessage.set(apiError.message);
        this.fieldErrors.set(apiError.fieldErrors);
        this.saving.set(false);
      }
    });
  }

  private update(key: number, changes: Partial<SaleLineDraft>): void {
    this.lines.update((lines) => lines.map((line) => (line.key === key ? { ...line, ...changes } : line)));
  }
}
