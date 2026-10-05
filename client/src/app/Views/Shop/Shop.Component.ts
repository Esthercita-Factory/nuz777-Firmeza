import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { toApiError } from '../../Services/Api.Service';
import { CartService } from '../../Services/cart.service';
import { Product, ProductsService } from '../../Services/products.service';
import { ToastService } from '../../Services/imports.service';
import { ConfirmService } from '../../Services/confirm.service';
import { IconComponent } from '../Shared/Icon.Component';

/**
 * Catalogo del portal del cliente: consulta productos, arma el carrito y
 * confirma la compra. El POST de la venta lo hace CheckoutComponent, que ya
 * sabe resolver la ficha del cliente y descargar el recibo.
 */
@Component({
  selector: 'app-shop',
  imports: [FormsModule, RouterLink, CurrencyPipe, IconComponent],
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-sm font-black uppercase tracking-[0.2em] text-blue-600">Tienda</p>
        <h1 class="mt-2 text-3xl font-black tracking-tight text-slate-950">Catálogo de materiales</h1>
        <p class="mt-2 text-slate-500">Agrega productos al carrito y confirma la compra.</p>
      </div>
      <a
        routerLink="/carrito"
        class="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-600"
      >
        <app-icon name="cart" [size]="16" />
        Ver carrito
        @if (cart.count() > 0) {
          <span class="rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-black text-white">{{ cart.count() }}</span>
        }
      </a>
    </div>

    <form class="mt-8 flex flex-wrap gap-3" (ngSubmit)="search()">
      <input
        name="q"
        [(ngModel)]="queryText"
        placeholder="Buscar por código o nombre..."
        class="min-w-[240px] flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      />
      <button type="submit" class="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800">Buscar</button>
    </form>

    @if (errorMessage(); as message) {
      <div class="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-800">{{ message }}</div>
    }

    @if (loading()) {
      <div class="mt-6 flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-20 shadow-sm">
        <svg viewBox="0 0 24 24" fill="none" class="h-8 w-8 animate-spin text-blue-500">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-25" />
          <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
        </svg>
        <span class="ml-3 text-sm font-semibold text-slate-500">Cargando catálogo…</span>
      </div>
    }

    <div class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      @for (product of products(); track product.id) {
        <article class="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md">
          <div class="flex items-start justify-between gap-3">
            <span class="rounded-lg bg-blue-50 px-2.5 py-1 font-mono text-xs font-bold text-blue-700">{{ product.sku }}</span>
            <span
              class="rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider"
              [class]="product.stock > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'"
            >
              {{ product.stock > 0 ? 'Disponible' : 'Agotado' }}
            </span>
          </div>

          <h3 class="mt-3 text-base font-bold text-slate-900">{{ product.name }}</h3>
          <p class="mt-1 text-xs text-slate-500">{{ product.category }} · por {{ product.unit }}</p>

          @if (product.description) {
            <p class="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">{{ product.description }}</p>
          }

          <div class="mt-4 flex items-end justify-between">
            <div>
              <p class="text-xl font-black text-slate-950">{{ product.price | currency: 'COP' }}</p>
              <p class="text-xs text-slate-400">{{ product.stock }} {{ product.unit }} en stock</p>
            </div>
          </div>

          <div class="mt-5 flex items-center gap-2">
            <button
              type="button"
              class="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              [disabled]="product.stock <= 0 || cart.quantityOf(product.id) >= product.stock"
              (click)="add(product)"
            >
              @if (product.stock <= 0) {
                Sin stock
              } @else if (cart.quantityOf(product.id) > 0) {
                Agregar más ({{ cart.quantityOf(product.id) }}/{{ product.stock }})
              } @else {
                Agregar al carrito
              }
            </button>
          </div>
        </article>
      } @empty {
        @if (!loading()) {
          <div class="rounded-2xl border border-slate-200 bg-white px-6 py-20 text-center shadow-sm sm:col-span-2 lg:col-span-3">
            <p class="text-sm font-bold text-slate-700">No hay productos que coincidan</p>
            <p class="mt-1 text-xs text-slate-400">Prueba con otro término de búsqueda.</p>
          </div>
        }
      }
    </div>

    @if (totalPages() > 1) {
      <div class="mt-6 flex items-center justify-between">
        <p class="text-xs font-semibold text-slate-500">Página {{ page() }} de {{ totalPages() }} · {{ totalCount() }} productos</p>
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
export class ShopComponent implements OnInit {
  protected readonly cart = inject(CartService);
  private readonly productsService = inject(ProductsService);
  private readonly toastService = inject(ToastService);
  private readonly confirmService = inject(ConfirmService);

  protected readonly products = signal<Product[]>([]);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly page = signal(1);
  protected readonly totalPages = signal(0);
  protected readonly totalCount = signal(0);
  protected queryText = '';

  ngOnInit(): void {
    this.load();
  }

  protected search(): void {
    this.page.set(1);
    this.load();
  }

  protected goToPage(page: number): void {
    this.page.set(page);
    this.load();
  }

  protected add(product: Product): void {
    const available = this.cart.availableToAdd(product);
    if (available <= 0) {
      this.toastService.error('No hay más unidades disponibles de este producto.');
      return;
    }

    this.cart.add(product, 1);
    this.toastService.success(`${product.name} agregado al carrito.`);
  }

  private load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.productsService
      .list({
        q: this.queryText.trim() || undefined,
        onlyActive: true,
        page: this.page(),
        pageSize: 12
      })
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          this.products.set(response.items);
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