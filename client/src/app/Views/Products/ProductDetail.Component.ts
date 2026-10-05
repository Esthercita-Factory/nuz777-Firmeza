import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { toApiError } from '../../Services/Api.Service';
import { Product, ProductsService } from '../../Services/products.service';
import { ConfirmService } from '../../Services/confirm.service';
import { ImportsService, ToastService } from '../../Services/imports.service';
import { IconComponent } from '../Shared/Icon.Component';

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, CurrencyPipe, DatePipe, IconComponent],
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
          <span class="ml-3 text-sm font-semibold text-slate-500">Cargando producto…</span>
        </div>
      }

      @if (product(); as current) {
        <div class="flex flex-wrap items-center justify-between gap-3">
          <a routerLink="/productos" class="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-500">
            <app-icon name="arrow-left" [size]="16" />
            Volver a productos
          </a>
          <div class="flex items-center gap-2">
            <a
              [routerLink]="['/productos', current.id, 'editar']"
              class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-500"
            >
              <app-icon name="pencil" [size]="14" />
              Editar
            </a>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-rose-500"
              (click)="remove(current)"
            >
              <app-icon name="trash" [size]="14" />
              Eliminar
            </button>
          </div>
        </div>

        <div class="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="text-sm font-black uppercase tracking-[0.2em] text-blue-600">Ficha de producto</p>
            <h1 class="mt-1 font-mono text-3xl font-black text-slate-950">{{ current.sku }}</h1>
            <p class="mt-1 text-slate-500">{{ current.name }}</p>
          </div>
          <span
            class="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold ring-1"
            [class]="current.isActive ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-100 text-slate-500 ring-slate-200'"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true"></span>
            {{ current.isActive ? 'Activo' : 'Inactivo' }}
          </span>
        </div>

        <div class="mt-6 grid gap-5 sm:grid-cols-3">
          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p class="text-xs font-black uppercase tracking-wider text-slate-400">Precio</p>
            <p class="mt-2 text-2xl font-black text-slate-950">{{ current.price | currency: 'COP' }}</p>
            <p class="mt-1 text-xs text-slate-500">Por {{ current.unit }}</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p class="text-xs font-black uppercase tracking-wider text-slate-400">Existencias</p>
            <p class="mt-2 text-2xl font-black" [class]="current.stock < 10 ? 'text-rose-600' : 'text-slate-950'">{{ current.stock }}</p>
            <p class="mt-1 text-xs text-slate-500">{{ current.unit }} disponibles</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p class="text-xs font-black uppercase tracking-wider text-slate-400">Categoría</p>
            <p class="mt-2 text-2xl font-black text-slate-950">{{ current.category }}</p>
          </div>
        </div>

        <div class="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          <h3 class="text-xs font-black uppercase tracking-wider text-slate-400">Descripción</h3>
          <p class="mt-3 leading-6">{{ current.description || 'Sin descripción registrada.' }}</p>
        </div>

        <div class="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          <h3 class="text-xs font-black uppercase tracking-wider text-slate-400">Auditoría</h3>
          <div class="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <span class="block text-xs text-slate-400">Creado:</span>
              <span class="font-bold text-slate-900">{{ current.createdAt | date: 'dd/MM/yyyy HH:mm' }}</span>
            </div>
            <div>
              <span class="block text-xs text-slate-400">Última actualización:</span>
              <span class="font-bold text-slate-900">{{ current.updatedAt ? (current.updatedAt | date: 'dd/MM/yyyy HH:mm') : 'Sin actualizaciones' }}</span>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ProductDetailComponent implements OnInit {
  readonly id = input<string>();

  protected readonly productsService = inject(ProductsService);
  private readonly confirmService = inject(ConfirmService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly product = signal<Product | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.id();
    if (!id) return;

    this.loading.set(true);
    this.productsService.getById(id).subscribe({
      next: (product) => {
        this.loading.set(false);
        this.product.set(product);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(toApiError(error).message);
      }
    });
  }

  protected async remove(product: Product): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Eliminar producto',
      message: `¿Eliminar ${product.sku} · ${product.name}? Esta accion no se puede deshacer.`
    });
    if (!confirmed) return;

    this.productsService.delete(product.id).subscribe({
      next: () => {
        this.toastService.success('Producto eliminado.');
        this.router.navigate(['/productos']);
      },
      error: (error) => this.toastService.error(toApiError(error).message)
    });
  }
}