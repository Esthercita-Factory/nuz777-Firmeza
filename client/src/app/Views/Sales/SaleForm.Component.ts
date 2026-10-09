import { CurrencyPipe } from '@angular/common';
import { Component, HostListener, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { toApiError } from '../../Services/Api.Service';
import { Customer, CustomersService } from '../../Services/customers.service';
import { ImportsService, ToastService } from '../../Services/imports.service';
import { Product, ProductsService } from '../../Services/products.service';
import { SaleLineRequest, SaleStatus, SalesService, TAX_RATE } from '../../Services/sales.service';
import { AdminNotificationService } from '../../Services/admin-notification.service';

if (typeof window !== 'undefined' && !(window as any).matchMedia) {
  (window as any).matchMedia = () => ({
    matches: false,
    media: '',
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  });
}

interface SaleLineDraft {
  key: number;
  productId: string;
  quantity: number;
  unitPrice: number;
}

@Component({
  selector: 'app-sale-form',
  imports: [FormsModule, RouterLink, CurrencyPipe],
  template: `
    <div class="mx-auto max-w-4xl space-y-6">
      <!-- CABECERA PROFESIONAL CON BREADCRUMB -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div class="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/80 px-3 py-1 text-xs font-bold text-blue-700 shadow-2xs">
            <span class="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            Facturación & Ventas
          </div>
          <h1 class="text-3xl font-black tracking-tight text-slate-950">
            {{ isEdit() ? 'Editar venta' : 'Registrar nueva venta' }}
          </h1>
          <p class="mt-1 text-xs text-slate-500">
            @if (isEdit()) {
              Ajusta las cantidades y productos de {{ saleNumber() }}. El inventario se sincroniza automáticamente.
            } @else {
              Selecciona el cliente y los materiales. Se liquidarán impuestos y se emitirá el comprobante PDF.
            }
          </p>
        </div>
        <a
          routerLink="/ventas"
          (click)="clearDraft()"
          class="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Volver a ventas
        </a>
      </div>

      @if (loadError(); as message) {
        <div class="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-xs font-semibold text-rose-800 shadow-sm flex items-start gap-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4 shrink-0 text-rose-600 mt-0.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <span>{{ message }}</span>
        </div>
      }

      @if (errorMessage(); as message) {
        <div class="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-xs font-semibold text-rose-800 shadow-sm flex items-start gap-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4 shrink-0 text-rose-600 mt-0.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <span>{{ message }}</span>
        </div>
      }

      <form
        class="space-y-6"
        (ngSubmit)="onSubmit()"
        (input)="saveDraft()"
        (change)="saveDraft()"
        [class.opacity-60]="loadingSale()"
      >
        <!-- SECCIÓN 1: DATOS DEL CLIENTE Y ESTADO -->
        <section class="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
          <div class="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
            <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold text-sm">
              1
            </span>
            <div>
              <h2 class="text-sm font-black text-slate-900">Cliente y Estado Comercial</h2>
              <p class="text-xs text-slate-400">Titular de la orden y estado de despacho del pedido.</p>
            </div>
          </div>

          <div class="grid gap-6 sm:grid-cols-2">
            <!-- Cliente -->
            <div class="space-y-1.5">
              <label for="customerId" class="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Cliente titular <span class="text-rose-500">*</span>
              </label>
              <div class="relative">
                <select
                  id="customerId"
                  name="customerId"
                  [(ngModel)]="customerId"
                  class="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  [class.border-rose-400]="fieldError('customerId')"
                  required
                >
                  <option [ngValue]="null">-- Selecciona un cliente --</option>
                  @for (customer of customers(); track customer.id) {
                    <option [ngValue]="customer.id">{{ customer.document }} · {{ customer.fullName }}</option>
                  }
                </select>
              </div>
              @if (fieldError('customerId'); as message) {
                <p class="text-xs font-medium text-rose-600 flex items-center gap-1">
                  <span class="h-1 w-1 rounded-full bg-rose-600"></span>{{ message }}
                </p>
              }
            </div>

            <!-- Estado -->
            <div class="space-y-1.5">
              <label for="status" class="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Estado de la orden
              </label>
              <select
                id="status"
                name="status"
                [(ngModel)]="status"
                class="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              >
                <option [ngValue]="null">Pendiente (por defecto)</option>
                @for (option of statusOptions; track option.value) {
                  <option [ngValue]="option.value">{{ option.label }}</option>
                }
              </select>
              <p class="text-[11px] text-slate-400">
                Al confirmar o entregar, el inventario se descuenta de inmediato.
              </p>
            </div>
          </div>
        </section>

        <!-- SECCIÓN 2: PRODUCTOS Y MATERIALES -->
        <section class="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
            <div class="flex items-center gap-3">
              <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold text-sm">
                2
              </span>
              <div>
                <h2 class="text-sm font-black text-slate-900">Materiales y Cantidades</h2>
                <p class="text-xs text-slate-400">Agrega las líneas que componen la compra.</p>
              </div>
            </div>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-200 px-4 py-2 text-xs font-bold text-blue-700 shadow-2xs transition hover:bg-blue-100 active:scale-95"
              (click)="addLine()"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="h-3.5 w-3.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Agregar producto
            </button>
          </div>

          <div class="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table class="w-full text-left text-sm">
              <thead class="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 font-bold">
                <tr>
                  <th class="px-4 py-3.5 min-w-[240px]">Producto</th>
                  <th class="px-4 py-3.5 text-center">Disponible</th>
                  <th class="px-4 py-3.5 text-center w-28">Cantidad</th>
                  <th class="px-4 py-3.5 text-right w-36">Precio unitario</th>
                  <th class="px-4 py-3.5 text-right w-32">Subtotal</th>
                  <th class="px-3 py-3.5 w-12"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium">
                @for (line of lines(); track line.key) {
                  <tr class="transition hover:bg-slate-50/70">
                    <td class="px-4 py-3">
                      <select
                        class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        [ngModel]="line.productId"
                        [ngModelOptions]="{ standalone: true }"
                        (ngModelChange)="onProductChange(line, $event)"
                      >
                        <option [ngValue]="''">-- Seleccionar producto --</option>
                        @for (product of products(); track product.id) {
                          <option [ngValue]="product.id">
                            [{{ product.sku }}] {{ product.name }} ({{ product.stock }} {{ product.unit }})
                          </option>
                        }
                      </select>
                    </td>
                    <td class="px-4 py-3 text-center">
                      @if (stockFor(line.productId); as s) {
                        <span
                          class="inline-block px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold"
                          [class]="s > 10 ? 'bg-emerald-100 text-emerald-800' : s > 0 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'"
                        >
                          {{ s }}
                        </span>
                      } @else {
                        <span class="text-xs text-slate-400 font-mono">-</span>
                      }
                    </td>
                    <td class="px-4 py-3 text-center">
                      <input
                        type="number"
                        min="1"
                        class="w-20 rounded-xl border border-slate-300 px-2.5 py-1.5 text-center text-xs font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        [ngModel]="line.quantity"
                        [ngModelOptions]="{ standalone: true }"
                        (keydown)="onNumericKeyDown($event, 'la cantidad')"
                        (ngModelChange)="onQuantityChange(line, $event)"
                      />
                    </td>
                    <td class="px-4 py-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        class="w-28 rounded-xl border border-slate-300 px-2.5 py-1.5 text-right text-xs font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        [ngModel]="line.unitPrice"
                        [ngModelOptions]="{ standalone: true }"
                        (keydown)="onNumericKeyDown($event, 'el precio unitario', true)"
                        (ngModelChange)="onPriceChange(line, $event)"
                      />
                    </td>
                    <td class="px-4 py-3 text-right font-bold text-slate-900">
                      {{ line.quantity * line.unitPrice | currency: 'COP' }}
                    </td>
                    <td class="px-3 py-3 text-center">
                      <button
                        type="button"
                        aria-label="Quitar línea"
                        class="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 active:scale-95"
                        (click)="removeLine(line)"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="h-3.5 w-3.5">
                          <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="py-12 text-center text-xs text-slate-400">
                      <div class="flex flex-col items-center justify-center gap-2">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-8 w-8 text-slate-300">
                          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                          <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
                        </svg>
                        <span>No hay materiales agregados en esta orden.</span>
                        <button
                          type="button"
                          class="mt-1 text-xs font-bold text-blue-600 hover:text-blue-500"
                          (click)="addLine()"
                        >
                          + Agregar primer producto
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- RESUMEN DE TOTALES -->
          <div class="mt-8 border-t border-slate-100 pt-6">
            <div class="ml-auto max-w-sm rounded-2xl bg-slate-50/80 p-5 border border-slate-200/80 space-y-2.5 text-xs">
              <div class="flex justify-between text-slate-600">
                <span>Subtotal (base imponible):</span>
                <span class="font-bold text-slate-900">{{ subtotalBase() | currency: 'COP' }}</span>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>IVA ({{ (TAX_RATE * 100).toFixed(0) }}% incluido):</span>
                <span class="font-bold text-slate-900">{{ iva() | currency: 'COP' }}</span>
              </div>
              <div class="flex justify-between border-t border-slate-200 pt-3 text-sm font-black text-slate-950">
                <span>Total a liquidar:</span>
                <span class="text-lg text-blue-600">{{ total() | currency: 'COP' }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- BOTONES DE ACCIÓN -->
        <div class="flex flex-wrap items-center justify-end gap-3 pt-2">
          <a
            routerLink="/ventas"
            (click)="clearDraft()"
            class="rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95"
          >
            Cancelar
          </a>
          <button
            type="submit"
            class="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-8 py-3.5 text-xs font-bold text-white shadow-lg transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
            [disabled]="saving() || loadingSale()"
          >
            @if (saving() || loadingSale()) {
              <svg viewBox="0 0 24 24" fill="none" class="h-4 w-4 animate-spin text-white">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-25" />
                <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
              </svg>
              Procesando venta…
            } @else {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="h-4 w-4">
                <path d="m5 13 4 4L19 7" />
              </svg>
              {{ isEdit() ? 'Guardar cambios' : 'Registrar venta y emitir recibo PDF' }}
            }
          </button>
        </div>
      </form>
    </div>
  `
})
export class SaleFormComponent implements OnInit {
  /** Presente solo en modo edición: /ventas/:id/editar */
  readonly id = input<string>();

  private readonly customersService = inject(CustomersService);
  private readonly productsService = inject(ProductsService);
  private readonly salesService = inject(SalesService);
  private readonly importsService = inject(ImportsService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly TAX_RATE = TAX_RATE;

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
  protected readonly loadingSale = signal(false);
  protected readonly loadError = signal<string | null>(null);
  protected readonly saleNumber = signal<string>('');
  readonly locked = signal(false);

  protected readonly isEdit = computed(() => !!this.id());

  protected readonly total = computed(() =>
    this.lines().reduce((acc, line) => acc + (line.quantity || 0) * (line.unitPrice || 0), 0)
  );

  protected readonly subtotalBase = computed(() => {
    const scale = 100;
    const rounded = (value: number) => Math.round(Math.abs(value) * scale + Number.EPSILON) / scale * Math.sign(value);
    return rounded(this.total() / (1 + TAX_RATE));
  });

  protected readonly iva = computed(() => {
    const scale = 100;
    const rounded = (value: number) => Math.round(Math.abs(value) * scale + Number.EPSILON) / scale * Math.sign(value);
    return rounded(this.total() - this.subtotalBase());
  });

  private nextKey = 1;
  private lastToastTime = 0;

  private get draftKey(): string {
    const id = this.id();
    return id ? `firmeza-draft-sale-edit-${id}` : 'firmeza-draft-sale-new';
  }

  ngOnInit(): void {
    this.loadLookups();

    const id = this.id();
    if (id) {
      this.loadSale(id);
    } else {
      if (!this.restoreDraft()) {
        this.addLine();
      }
    }
  }

  /**
   * Alerta flotante SweetAlert para teclas no numéricas
   */
  protected notifyNumericWarning(fieldName = 'este campo'): void {
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

  protected onNumericKeyDown(event: KeyboardEvent, fieldName: string, allowDecimal = false): void {
    const allowed = [
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
    if (allowed.includes(event.key) || event.ctrlKey || event.metaKey) {
      return;
    }

    if (allowDecimal && (event.key === '.' || event.key === ',')) {
      const current = ((event.target as HTMLInputElement).value || '');
      if (!current.includes('.') && !current.includes(',')) {
        return;
      }
    }

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
      this.notifyNumericWarning(fieldName);
    }
  }

  protected saveDraft(): void {
    if (this.loadingSale()) return;

    queueMicrotask(() => {
      try {
        const payload = {
          customerId: this.customerId,
          status: this.status,
          lines: this.lines().map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            unitPrice: line.unitPrice
          }))
        };
        localStorage.setItem(this.draftKey, JSON.stringify(payload));
      } catch {}
    });
  }

  @HostListener('window:beforeunload')
  protected onBeforeUnload(): void {
    this.saveDraft();
  }

  protected clearDraft(): void {
    try {
      localStorage.removeItem(this.draftKey);
    } catch {}
  }

  private restoreDraft(): boolean {
    try {
      const raw = localStorage.getItem(this.draftKey);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return false;

      if (typeof data.customerId === 'string') {
        this.customerId = data.customerId;
      }
      if (typeof data.status === 'string') {
        this.status = data.status as SaleStatus;
      }

      if (Array.isArray(data.lines) && data.lines.length > 0) {
        const restoredLines: SaleLineDraft[] = data.lines.map((item: Partial<SaleLineDraft>) => ({
          key: this.nextKey++,
          productId: typeof item.productId === 'string' ? item.productId : '',
          quantity: typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1,
          unitPrice: typeof item.unitPrice === 'number' && item.unitPrice >= 0 ? item.unitPrice : 0
        }));
        this.lines.set(restoredLines);
        return true;
      }
      return !!(data.customerId || data.status);
    } catch {
      return false;
    }
  }

  protected addLine(): void {
    this.lines.update((lines) => [...lines, { key: this.nextKey++, productId: '', quantity: 1, unitPrice: 0 }]);
    this.saveDraft();
  }

  protected removeLine(line: SaleLineDraft): void {
    this.lines.update((lines) => lines.filter((item) => item.key !== line.key));
    this.saveDraft();
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
      void Swal.fire({
        icon: 'warning',
        title: 'Verifica los datos de la venta',
        text: 'Selecciona un cliente y al menos un producto con cantidad y precio válido.',
        confirmButtonText: 'Revisar orden',
        confirmButtonColor: '#0284c7',
        width: '420px'
      });
      return;
    }

    // Comprobar si hay líneas con producto sin seleccionar
    const emptyLines = this.lines().some((line) => !line.productId);
    if (emptyLines) {
      void Swal.fire({
        icon: 'warning',
        title: 'Productos sin seleccionar',
        text: 'Hay filas en la lista de materiales sin producto asignado. Selecciónalos o retira la fila vacía.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#0284c7',
        width: '420px'
      });
      return;
    }

    // Comprobar existencias si la venta se confirma
    if (this.status === 'Confirmed') {
      for (const line of validLines) {
        const product = this.products().find((p) => p.id === line.productId);
        if (product && line.quantity > product.stock) {
          void Swal.fire({
            icon: 'warning',
            title: 'Stock insuficiente',
            text: `El producto "${product.name}" solo cuenta con ${product.stock} unidades disponibles (solicitaste ${line.quantity}). Ajusta la cantidad o déjala en estado Pendiente.`,
            confirmButtonText: 'Ajustar cantidad',
            confirmButtonColor: '#0284c7',
            width: '420px'
          });
          return;
        }
      }
    }

    this.errorMessage.set(null);
    this.fieldErrors.set({});
    this.saving.set(true);

    const lines: SaleLineRequest[] = validLines.map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
      unitPrice: line.unitPrice
    }));

    const request = { customerId: this.customerId, status: this.status, lines };
    const id = this.id();

    const guardado$ = id
      ? this.salesService.update(id, request)
      : this.salesService.create(request);

    guardado$.subscribe({
      next: (sale) => {
        this.clearDraft();
        AdminNotificationService.broadcastStockChanged(sale.saleNumber, sale.status);
        this.toastService.success(id ? `Venta ${sale.saleNumber} actualizada exitosamente.` : `Venta ${sale.saleNumber} registrada exitosamente.`);
        this.importsService.download(this.salesService.receiptUrl(sale.id), `recibo_${sale.saleNumber}.pdf`).subscribe();
        this.router.navigate(['/ventas', sale.id]);
      },
      error: (error) => {
        const apiError = toApiError(error);
        this.errorMessage.set(apiError.message);
        this.fieldErrors.set(apiError.fieldErrors);
        this.saving.set(false);

        void Swal.fire({
          icon: 'error',
          title: 'No se pudo guardar la venta',
          text: apiError.message,
          confirmButtonColor: '#0284c7',
          confirmButtonText: 'Entendido',
          width: '420px'
        });
      }
    });
  }

  private update(key: number, changes: Partial<SaleLineDraft>): void {
    this.lines.update((lines) => lines.map((line) => (line.key === key ? { ...line, ...changes } : line)));
    this.saveDraft();
  }

  private loadLookups(): void {
    this.customersService.list({ onlyActive: true, pageSize: 100 }).subscribe({
      next: (response) => this.customers.set(response.items),
      error: (error) => this.loadError.set(toApiError(error).message)
    });

    this.productsService.list({ onlyActive: true, pageSize: 100 }).subscribe({
      next: (response) => this.products.set(response.items),
      error: (error) => this.loadError.set(toApiError(error).message)
    });
  }

  private loadSale(id: string): void {
    this.loadingSale.set(true);
    this.salesService.getById(id).subscribe({
      next: (sale) => {
        this.loadingSale.set(false);
        this.saleNumber.set(sale.saleNumber);
        this.customerId = sale.customerId;
        this.status = sale.status;
        this.locked.set(sale.status === 'Delivered');
        this.lines.set(
          sale.lines.map((line) => ({
            key: this.nextKey++,
            productId: line.productId,
            quantity: line.quantity,
            unitPrice: line.unitPrice
          }))
        );
        this.restoreDraft();
      },
      error: (error) => {
        this.loadingSale.set(false);
        const apiError = toApiError(error);
        this.loadError.set(apiError.message);
        void Swal.fire({
          icon: 'error',
          title: 'Error al cargar venta',
          text: apiError.message,
          confirmButtonColor: '#0284c7',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }
}
