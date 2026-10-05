import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { toApiError } from '../../Services/Api.Service';
import { CartService } from '../../Services/cart.service';
import { Sale, SalesService } from '../../Services/sales.service';
import { ConfirmService } from '../../Services/confirm.service';
import { ToastService } from '../../Services/imports.service';
import { IconComponent } from '../Shared/Icon.Component';

/**
 * Carrito y checkout.
 *
 * El cliente compra para si mismo: la API resuelve la ficha a partir del correo
 * del token y rechaza (403) si se intenta comprar a nombre de otro, asi que el
 * customerId sale del perfil y no se elige en un selector.
 */
@Component({
  selector: 'app-checkout',
  imports: [RouterLink, CurrencyPipe, IconComponent],
  template: `
    <a routerLink="/tienda" class="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-500">
      <app-icon name="arrow-left" [size]="16" />
      Seguir comprando
    </a>

    <h1 class="mt-4 text-3xl font-black tracking-tight text-slate-950">Carrito de compras</h1>

    @if (errorMessage(); as message) {
      <div class="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-800">{{ message }}</div>
    }

    @if (cart.isEmpty()) {
      <div class="mt-6 rounded-2xl border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
        <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
          <app-icon name="cart" [size]="26" />
        </span>
        <p class="mt-4 text-sm font-bold text-slate-700">Tu carrito está vacío</p>
        <p class="mt-1 text-xs text-slate-400">Agrega productos desde el catálogo para continuar.</p>
        <a routerLink="/tienda" class="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-500">
          Ver catálogo
        </a>
      </div>
    } @else {
      <div class="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <div class="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          <div class="overflow-x-auto">
            <table class="w-full min-w-[560px] text-left text-sm">
              <thead class="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th class="px-5 py-3">Producto</th>
                  <th class="px-5 py-3 text-center">Cantidad</th>
                  <th class="px-5 py-3 text-right">Precio</th>
                  <th class="px-5 py-3 text-right">Subtotal</th>
                  <th class="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (line of cart.lines(); track line.product.id) {
                  <tr>
                    <td class="px-5 py-4">
                      <p class="font-bold text-slate-900">{{ line.product.name }}</p>
                      <p class="font-mono text-xs text-slate-400">{{ line.product.sku }}</p>
                    </td>
                    <td class="px-5 py-4">
                      <div class="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          aria-label="Quitar una unidad"
                          class="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-50"
                          (click)="cart.decrement(line.product.id)"
                        >
                          −
                        </button>
                        <span class="w-10 text-center font-bold text-slate-900">{{ line.quantity }}</span>
                        <button
                          type="button"
                          aria-label="Agregar una unidad"
                          class="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                          [disabled]="cart.quantityOf(line.product.id) >= line.product.stock"
                          (click)="cart.increment(line.product.id)"
                        >
                          +
                        </button>
                      </div>
                      <p class="mt-1 text-center text-[10px] text-slate-400">máx. {{ line.product.stock }}</p>
                    </td>
                    <td class="px-5 py-4 text-right text-slate-600">{{ line.product.price | currency: 'COP' }}</td>
                    <td class="px-5 py-4 text-right font-bold text-slate-900">{{ lineTotal(line.product.price, line.quantity) | currency: 'COP' }}</td>
                    <td class="px-5 py-4 text-right">
                      <button
                        type="button"
                        title="Quitar del carrito"
                        class="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        (click)="removeLine(line.product.id, line.product.name)"
                      >
                        <app-icon name="trash" [size]="16" label="Quitar del carrito" />
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <aside class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
          <h2 class="text-base font-black text-slate-950">Resumen</h2>

          <dl class="mt-5 space-y-2 text-sm">
            <div class="flex justify-between text-slate-600">
              <dt>Subtotal (base):</dt>
              <dd class="font-bold text-slate-900">{{ cart.subtotalBase() | currency: 'COP' }}</dd>
            </div>
            <div class="flex justify-between text-slate-600">
              <dt>IVA ({{ (cart.taxes().rate * 100).toFixed(0) }}% inc.):</dt>
              <dd class="font-bold text-slate-900">{{ cart.iva() | currency: 'COP' }}</dd>
            </div>
            <div class="flex justify-between border-t border-slate-200 pt-3 text-base font-black text-slate-950">
              <dt>Total a pagar:</dt>
              <dd class="text-xl text-blue-600">{{ cart.total() | currency: 'COP' }}</dd>
            </div>
          </dl>

          <p class="mt-3 text-[11px] leading-5 text-slate-400">
            Los precios incluyen IVA. Al confirmar se genera el comprobante en PDF.
          </p>

          <button
            type="button"
            class="mt-5 w-full rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            [disabled]="saving()"
            (click)="confirmPurchase()"
          >
            {{ saving() ? 'Procesando…' : 'Solicitar producto' }}
          </button>

          <button
            type="button"
            class="mt-2 w-full rounded-xl border border-slate-300 px-5 py-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
            [disabled]="saving()"
            (click)="clear()"
          >
            Vaciar carrito
          </button>
        </aside>
      </div>
    }
  `
})
export class CheckoutComponent {
  protected readonly cart = inject(CartService);
  private readonly salesService = inject(SalesService);
  private readonly confirmService = inject(ConfirmService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly saving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    // El carrito vive en memoria: si se entro con la URL directa y no hay nada,
    // la plantilla muestra el estado vacio.
  }

  protected lineTotal(price: number, quantity: number): number {
    return price * quantity;
  }

  protected async removeLine(productId: string, name: string): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Quitar del carrito',
      message: `¿Quitar ${name} del carrito?`,
      confirmLabel: 'Quitar'
    });
    if (confirmed) {
      this.cart.remove(productId);
    }
  }

  protected async clear(): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Vaciar carrito',
      message: '¿Vaciar el carrito? Se quitarán todos los productos.',
      confirmLabel: 'Vaciar'
    });
    if (confirmed) {
      this.cart.clear();
    }
  }

  protected async confirmPurchase(): Promise<void> {
    if (this.saving() || this.cart.isEmpty()) return;

    const confirmed = await this.confirmService.confirm({
      title: 'Solicitar productos',
      message: `¿Enviar la solicitud por ${this.formatTotal()}? Un administrador la confirmara y luego marcara la entrega.`,
      confirmLabel: 'Solicitar',
      tone: 'default'
    });
    if (!confirmed) return;

    this.saving.set(true);
    this.errorMessage.set(null);

    const lines = this.cart
      .lines()
      .map((line) => ({ productId: line.product.id, quantity: line.quantity, unitPrice: line.product.price }));

    // customerId en null: el backend lo resuelve desde el correo del token, asi el
    // cliente no puede comprar en nombre de otro. Si lo mandamos, la API lo ignora.
    // status Pending: el cliente solicita y el administrador confirma despues.
    this.salesService.create({ customerId: null, status: 'Pending', lines }).subscribe({
      next: (sale) => {
        this.saving.set(false);
        this.cart.clear();
        this.toastService.success(`Solicitud ${sale.saleNumber} enviada. Queda pendiente de confirmacion.`);
        this.router.navigate(['/mis-compras']);
      },
      error: (error) => {
        const apiError = toApiError(error);
        this.saving.set(false);
        this.errorMessage.set(apiError.message);
        this.toastService.error(apiError.message);
      }
    });
  }

  private formatTotal(): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
      this.cart.total()
    );
  }
}