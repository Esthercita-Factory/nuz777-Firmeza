import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { toApiError } from '../../Services/Api.Service';
import { ToastService } from '../../Services/imports.service';
import { ProductRequest, ProductsService } from '../../Services/products.service';

@Component({
  selector: 'app-product-form',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="mx-auto max-w-4xl">
      <a routerLink="/productos" class="text-sm font-bold text-blue-600 hover:text-blue-500">← Volver a productos</a>

      <h1 class="mt-4 text-3xl font-black text-slate-950">{{ id() ? 'Editar producto' : 'Nuevo producto' }}</h1>

      @if (errorMessage(); as message) {
        <div class="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-800">{{ message }}</div>
      }

      @if (loading()) {
        <div class="mt-8 flex items-center justify-center rounded-3xl border border-slate-200 bg-white py-20 shadow-sm">
          <svg viewBox="0 0 24 24" fill="none" class="h-8 w-8 animate-spin text-blue-500">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-25" />
            <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
          </svg>
          <span class="ml-3 text-sm font-semibold text-slate-500">Cargando datos…</span>
        </div>
      } @else {
      <form class="mt-8 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm" (ngSubmit)="onSubmit()">
        <div class="grid gap-6 sm:grid-cols-2">
          <div class="space-y-1.5">
            <label for="sku" class="block text-sm font-bold text-slate-700">Código de producto</label>
            <input
              id="sku"
              name="sku"
              [(ngModel)]="form.sku"
              placeholder="Ej.: CEM-001"
              class="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm uppercase text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
            @if (fieldError('sku'); as message) {
              <p class="text-xs text-rose-600">{{ message }}</p>
            }
          </div>

          <div class="space-y-1.5">
            <label for="name" class="block text-sm font-bold text-slate-700">Nombre</label>
            <input
              id="name"
              name="name"
              [(ngModel)]="form.name"
              placeholder="Ej.: Cemento Portland 42.5 kg"
              class="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
            @if (fieldError('name'); as message) {
              <p class="text-xs text-rose-600">{{ message }}</p>
            }
          </div>

          <div class="space-y-1.5">
            <label for="category" class="block text-sm font-bold text-slate-700">Categoría</label>
            <input
              id="category"
              name="category"
              [(ngModel)]="form.category"
              placeholder="Ej.: Cementos"
              class="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
            @if (fieldError('category'); as message) {
              <p class="text-xs text-rose-600">{{ message }}</p>
            }
          </div>

          <div class="space-y-1.5">
            <label for="unit" class="block text-sm font-bold text-slate-700">Unidad de venta</label>
            <input
              id="unit"
              name="unit"
              [(ngModel)]="form.unit"
              placeholder="Ej.: Saco, Unidad, Metro"
              class="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
            @if (fieldError('unit'); as message) {
              <p class="text-xs text-rose-600">{{ message }}</p>
            }
          </div>

          <div class="space-y-1.5">
            <label for="price" class="block text-sm font-bold text-slate-700">Precio</label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0.01"
              [(ngModel)]="form.price"
              placeholder="Ej.: 48.50"
              class="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
            @if (fieldError('price'); as message) {
              <p class="text-xs text-rose-600">{{ message }}</p>
            }
          </div>

          <div class="space-y-1.5">
            <label for="stock" class="block text-sm font-bold text-slate-700">Stock</label>
            <input
              id="stock"
              name="stock"
              type="number"
              min="0"
              [(ngModel)]="form.stock"
              placeholder="Ej.: 120"
              class="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
            @if (fieldError('stock'); as message) {
              <p class="text-xs text-rose-600">{{ message }}</p>
            }
          </div>

          <div class="space-y-1.5 sm:col-span-2">
            <label for="description" class="block text-sm font-bold text-slate-700">Descripción</label>
            <textarea
              id="description"
              name="description"
              rows="3"
              [(ngModel)]="form.description"
              placeholder="Ej.: Cemento uso general, presentación de 42.5 kg"
              class="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            ></textarea>
          </div>

          <div class="flex items-center justify-between gap-5 rounded-xl bg-slate-50 p-4 sm:col-span-2">
            <div>
              <span class="block text-sm font-bold text-slate-700">Activo</span>
              <p class="text-xs text-slate-400">Los productos inactivos no aparecen para la venta.</p>
            </div>
            <input id="isActive" name="isActive" type="checkbox" [(ngModel)]="form.isActive" class="h-5 w-5 rounded border-slate-300 text-blue-500" />
          </div>
        </div>

        <div class="mt-8 flex justify-end gap-3">
          <a routerLink="/productos" class="rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 shadow-sm">Cancelar</a>
          <button
            type="submit"
            class="rounded-xl bg-slate-950 px-8 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-blue-500 hover:text-slate-950 disabled:opacity-60"
            [disabled]="saving()"
          >
            {{ id() ? 'Guardar cambios' : 'Crear producto' }}
          </button>
        </div>
      </form>
      }
    </div>
  `
})
export class ProductFormComponent implements OnInit {
  readonly id = input<string>();

  private readonly productsService = inject(ProductsService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  protected form = {
    sku: '',
    name: '',
    description: '',
    category: '',
    unit: 'Unidad',
    price: 0,
    stock: 0,
    isActive: true
  };

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly fieldErrors = signal<Record<string, string>>({});

  ngOnInit(): void {
    const id = this.id();
    if (!id) return;

    this.loading.set(true);
    this.productsService.getById(id).subscribe({
      next: (product) => {
        this.loading.set(false);
        this.form = {
          sku: product.sku,
          name: product.name,
          description: product.description ?? '',
          category: product.category,
          unit: product.unit,
          price: product.price,
          stock: product.stock,
          isActive: product.isActive
        };
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(toApiError(error).message);
      }
    });
  }

  protected fieldError(field: string): string | null {
    return this.fieldErrors()[field] ?? null;
  }

  protected onSubmit(): void {
    if (this.saving()) return;

    this.errorMessage.set(null);
    this.fieldErrors.set({});
    this.saving.set(true);

    const request: ProductRequest = {
      sku: this.form.sku.trim().toUpperCase(),
      name: this.form.name.trim(),
      description: this.form.description.trim() || null,
      category: this.form.category.trim(),
      unit: this.form.unit.trim(),
      price: Number(this.form.price),
      stock: Number(this.form.stock),
      isActive: this.form.isActive
    };

    const id = this.id();
    const request$ = id ? this.productsService.update(id, request) : this.productsService.create(request);

    request$.subscribe({
      next: () => {
        this.toastService.success(id ? 'Producto actualizado.' : 'Producto creado.');
        this.router.navigate(['/productos']);
      },
      error: (error) => {
        const apiError = toApiError(error);
        this.errorMessage.set(apiError.message);
        this.fieldErrors.set(apiError.fieldErrors);
        this.saving.set(false);
      }
    });
  }
}
