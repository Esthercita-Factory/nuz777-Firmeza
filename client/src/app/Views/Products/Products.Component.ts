import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../Shared/Icon.Component';
import { toApiError } from '../../Services/Api.Service';
import { ConfirmService } from '../../Services/confirm.service';
import { ImportsService, ToastService } from '../../Services/imports.service';
import { Product, ProductsService } from '../../Services/products.service';

@Component({
  selector: 'app-products',
  imports: [IconComponent, FormsModule, RouterLink, CurrencyPipe],
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-sm font-black uppercase tracking-[0.2em] text-blue-600">Catálogo</p>
        <h1 class="mt-2 text-3xl font-black tracking-tight text-slate-950">Productos</h1>
        <p class="mt-2 text-slate-500">Materiales disponibles para tu operación.</p>
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
        <a routerLink="/productos/nuevo" class="rounded-xl bg-blue-400 px-5 py-2.5 text-sm font-black text-slate-950 shadow-lg shadow-blue-100 transition hover:bg-blue-300">
          + Nuevo producto
        </a>
      </div>
    </div>

    <form class="mt-8 flex flex-wrap gap-3" (ngSubmit)="search()">
      <input
        name="q"
        [(ngModel)]="queryText"
        placeholder="Buscar por código, nombre o categoría..."
        class="min-w-[260px] flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      />
      <button type="submit" class="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800">Buscar</button>
      <button type="button" class="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50" (click)="toggleOnlyActive()">
        {{ onlyActive() ? 'Ver todos' : 'Solo activos' }}
      </button>
    </form>

    @if (errorMessage(); as message) {
      <div class="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-800">{{ message }}</div>
    }

    <div class="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[850px] text-left text-sm">
          <thead class="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th class="px-6 py-4">Código</th>
              <th class="px-6 py-4">Producto</th>
              <th class="px-6 py-4">Categoría</th>
              <th class="px-6 py-4 text-right">Precio</th>
              <th class="px-6 py-4 text-right">Stock</th>
              <th class="px-6 py-4">Estado</th>
              <th class="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @for (product of products(); track product.id) {
              <tr [class]="product.isActive ? 'hover:bg-blue-50/40' : 'bg-slate-50 text-slate-400'">
                <td class="px-6 py-4 font-mono text-xs font-bold text-blue-700">{{ product.sku }}</td>
                <td class="px-6 py-4">
                  <p class="font-bold text-slate-900">{{ product.name }}</p>
                  <p class="text-xs text-slate-500">Por {{ product.unit }}</p>
                </td>
                <td class="px-6 py-4 text-slate-600">{{ product.category }}</td>
                <td class="px-6 py-4 text-right font-bold">{{ product.price | currency: 'COP' }}</td>
                <td class="px-6 py-4 text-right">
                  <span class="font-bold" [class]="product.stock < 10 ? 'text-rose-600' : 'text-slate-900'">{{ product.stock }}</span>
                </td>
                <td class="px-6 py-4">
                  <span class="rounded-full px-3 py-1 text-xs font-bold" [class]="product.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'">
                    {{ product.isActive ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center justify-end gap-1">
                    <a
                      [routerLink]="['/productos', product.id]"
                      title="Ver producto"
                      class="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                    >
                      <app-icon name="eye" [size]="16" label="Ver producto" />
                    </a>
                    <a
                      [routerLink]="['/productos', product.id, 'editar']"
                      title="Editar producto"
                      class="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                    >
                      <app-icon name="pencil" [size]="16" label="Editar producto" />
                    </a>
                    <button
                      type="button"
                      title="Eliminar producto"
                      class="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      (click)="remove(product)"
                    >
                      <app-icon name="trash" [size]="16" label="Eliminar producto" />
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="px-6 py-14 text-center text-slate-500">No hay productos que coincidan con la búsqueda.</td>
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
export class ProductsComponent implements OnInit {
  private readonly productsService = inject(ProductsService);
  private readonly importsService = inject(ImportsService);
  private readonly toastService = inject(ToastService);
  private readonly confirmService = inject(ConfirmService);

  protected readonly products = signal<Product[]>([]);
  protected queryText = '';
  protected readonly onlyActive = signal(false);
  protected readonly page = signal(1);
  protected readonly totalPages = signal(0);
  protected readonly totalCount = signal(0);
  protected readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  protected search(): void {
    this.page.set(1);
    this.load();
  }

  protected toggleOnlyActive(): void {
    this.onlyActive.set(!this.onlyActive());
    this.search();
  }

  protected goToPage(page: number): void {
    this.page.set(page);
    this.load();
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
        this.load();
      },
      error: (error) => this.toastService.error(toApiError(error).message)
    });
  }

  protected exportFile(format: 'excel' | 'pdf'): void {
    const url = format === 'excel' ? this.productsService.exportExcelUrl() : this.productsService.exportPdfUrl();

    this.importsService.download(url, `catalogo_productos.${format === 'excel' ? 'xlsx' : 'pdf'}`).subscribe({
      next: () => this.toastService.success(`Catalogo exportado (${format.toUpperCase()}).`),
      error: (error) => this.toastService.error(toApiError(error).message)
    });
  }

  private load(): void {
    this.productsService
      .list({
        q: this.queryText.trim() || undefined,
        onlyActive: this.onlyActive() ? true : undefined,
        page: this.page(),
        pageSize: 20
      })
      .subscribe({
        next: (response) => {
          this.products.set(response.items);
          this.page.set(response.page);
          this.totalPages.set(response.totalPages);
          this.totalCount.set(response.totalCount);
        },
        error: (error) => this.errorMessage.set(toApiError(error).message)
      });
  }
}
