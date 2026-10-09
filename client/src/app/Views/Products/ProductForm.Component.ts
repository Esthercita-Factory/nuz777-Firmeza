import { Component, HostListener, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { toApiError } from '../../Services/Api.Service';
import { AdminNotificationService } from '../../Services/admin-notification.service';
import { ToastService } from '../../Services/imports.service';
import { ProductRequest, ProductsService } from '../../Services/products.service';

@Component({
  selector: 'app-product-form',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="mx-auto max-w-4xl space-y-6">
      <!-- CABECERA PROFESIONAL CON BREADCRUMB -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div class="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/80 px-3 py-1 text-xs font-bold text-blue-700 shadow-2xs">
            <span class="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            Inventario & Catálogo
          </div>
          <h1 class="text-3xl font-black tracking-tight text-slate-950">
            {{ id() ? 'Editar producto' : 'Nuevo producto' }}
          </h1>
          <p class="mt-1 text-xs text-slate-500">
            Completa la información técnica, precios de venta y existencias en bodega.
          </p>
        </div>
        <a
          routerLink="/productos"
          (click)="clearDraft()"
          class="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Volver a productos
        </a>
      </div>

      @if (errorMessage(); as message) {
        <div class="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-xs font-semibold text-rose-800 shadow-sm flex items-start gap-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4 shrink-0 text-rose-600 mt-0.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <span>{{ message }}</span>
        </div>
      }

      @if (loading()) {
        <div class="flex items-center justify-center rounded-3xl border border-slate-200 bg-white py-24 shadow-sm">
          <svg viewBox="0 0 24 24" fill="none" class="h-8 w-8 animate-spin text-blue-600">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-25" />
            <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
          </svg>
          <span class="ml-3 text-sm font-semibold text-slate-600">Cargando datos del producto…</span>
        </div>
      } @else {
        <form
          class="space-y-6"
          (ngSubmit)="onSubmit()"
          (input)="saveDraft()"
          (change)="saveDraft()"
        >
          <!-- SECCIÓN 1: IDENTIFICACIÓN DEL PRODUCTO -->
          <div class="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
            <div class="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
              <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold text-sm">
                1
              </span>
              <div>
                <h2 class="text-sm font-black text-slate-900">Identificación y Clasificación</h2>
                <p class="text-xs text-slate-400">Código SKU, nombre del material y categoría de inventario.</p>
              </div>
            </div>

            <div class="grid gap-6 sm:grid-cols-2">
              <!-- SKU -->
              <div class="space-y-1.5">
                <label for="sku" class="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Código SKU <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <input
                    id="sku"
                    name="sku"
                    [(ngModel)]="form.sku"
                    placeholder="Ej.: CEM-001"
                    class="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm uppercase font-mono font-bold text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    [class.border-rose-400]="fieldError('sku')"
                  />
                </div>
                @if (fieldError('sku'); as message) {
                  <p class="text-xs font-medium text-rose-600 flex items-center gap-1">
                    <span class="h-1 w-1 rounded-full bg-rose-600"></span>{{ message }}
                  </p>
                }
              </div>

              <!-- Nombre -->
              <div class="space-y-1.5">
                <label for="name" class="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Nombre del producto <span class="text-rose-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  [(ngModel)]="form.name"
                  placeholder="Ej.: Cemento Gris Portland 50 kg"
                  class="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  [class.border-rose-400]="fieldError('name')"
                />
                @if (fieldError('name'); as message) {
                  <p class="text-xs font-medium text-rose-600 flex items-center gap-1">
                    <span class="h-1 w-1 rounded-full bg-rose-600"></span>{{ message }}
                  </p>
                }
              </div>

              <!-- Categoría -->
              <div class="space-y-1.5">
                <label for="category" class="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Categoría <span class="text-rose-500">*</span>
                </label>
                <input
                  id="category"
                  name="category"
                  [(ngModel)]="form.category"
                  placeholder="Ej.: Cementos, Aceros, Acabados"
                  class="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  [class.border-rose-400]="fieldError('category')"
                />
                @if (fieldError('category'); as message) {
                  <p class="text-xs font-medium text-rose-600 flex items-center gap-1">
                    <span class="h-1 w-1 rounded-full bg-rose-600"></span>{{ message }}
                  </p>
                }
              </div>

              <!-- Unidad de venta -->
              <div class="space-y-1.5">
                <label for="unit" class="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Unidad de medida <span class="text-rose-500">*</span>
                </label>
                <input
                  id="unit"
                  name="unit"
                  [(ngModel)]="form.unit"
                  placeholder="Ej.: bulto, varilla, m3, unidad"
                  class="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  [class.border-rose-400]="fieldError('unit')"
                />
                @if (fieldError('unit'); as message) {
                  <p class="text-xs font-medium text-rose-600 flex items-center gap-1">
                    <span class="h-1 w-1 rounded-full bg-rose-600"></span>{{ message }}
                  </p>
                }
              </div>
            </div>
          </div>

          <!-- SECCIÓN 2: PRECIOS Y EXISTENCIAS -->
          <div class="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
            <div class="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
              <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold text-sm">
                2
              </span>
              <div>
                <h2 class="text-sm font-black text-slate-900">Precios y Control de Inventario</h2>
                <p class="text-xs text-slate-400">Valores comerciales en COP y cantidad disponible para despacho.</p>
              </div>
            </div>

            <div class="grid gap-6 sm:grid-cols-2">
              <!-- Precio -->
              <div class="space-y-1.5">
                <label for="price" class="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Precio unitario (COP) <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 font-bold text-slate-400 text-sm">
                    $
                  </span>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    [(ngModel)]="form.price"
                    (keydown)="onNumericKeyDown($event, 'el precio', true)"
                    placeholder="Ej.: 34500"
                    class="w-full rounded-xl border border-slate-300 bg-slate-50/50 pl-8 pr-4 py-3 text-sm font-bold text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    [class.border-rose-400]="fieldError('price')"
                  />
                </div>
                @if (fieldError('price'); as message) {
                  <p class="text-xs font-medium text-rose-600 flex items-center gap-1">
                    <span class="h-1 w-1 rounded-full bg-rose-600"></span>{{ message }}
                  </p>
                }
              </div>

              <!-- Stock -->
              <div class="space-y-1.5">
                <label for="stock" class="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Stock disponible <span class="text-rose-500">*</span>
                </label>
                <input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  [(ngModel)]="form.stock"
                  (keydown)="onNumericKeyDown($event, 'el stock', false)"
                  placeholder="Ej.: 150"
                  class="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  [class.border-rose-400]="fieldError('stock')"
                />
                @if (fieldError('stock'); as message) {
                  <p class="text-xs font-medium text-rose-600 flex items-center gap-1">
                    <span class="h-1 w-1 rounded-full bg-rose-600"></span>{{ message }}
                  </p>
                }
              </div>
            </div>
          </div>

          <!-- SECCIÓN 3: DETALLES Y ESTADO -->
          <div class="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
            <div class="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
              <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 font-bold text-sm">
                3
              </span>
              <div>
                <h2 class="text-sm font-black text-slate-900">Descripción y Estado</h2>
                <p class="text-xs text-slate-400">Información adicional para los clientes y estado de visibilidad.</p>
              </div>
            </div>

            <div class="space-y-6">
              <!-- Descripción -->
              <div class="space-y-1.5">
                <label for="description" class="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Descripción del material
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows="3"
                  [(ngModel)]="form.description"
                  placeholder="Ej.: Cemento Portland para uso estructural de alta resistencia..."
                  class="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                ></textarea>
              </div>

              <!-- Switch Activo -->
              <div class="flex items-center justify-between gap-5 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 transition">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-bold text-slate-900">Producto activo</span>
                    <span
                      class="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      [class]="form.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'"
                    >
                      {{ form.isActive ? 'Visible' : 'Oculto' }}
                    </span>
                  </div>
                  <p class="mt-0.5 text-xs text-slate-500">
                    Solo los materiales activos se muestran en el catálogo del cliente y pueden seleccionarse en ventas.
                  </p>
                </div>
                <label class="relative inline-flex cursor-pointer items-center">
                  <input
                    id="isActive"
                    name="isActive"
                    type="checkbox"
                    [(ngModel)]="form.isActive"
                    class="peer sr-only"
                  />
                  <div class="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-focus:outline-none"></div>
                </label>
              </div>
            </div>
          </div>

          <!-- BOTONES DE ACCIÓN -->
          <div class="flex flex-wrap items-center justify-end gap-3 pt-2">
            <a
              routerLink="/productos"
              (click)="clearDraft()"
              class="rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95"
            >
              Cancelar
            </a>
            <button
              type="submit"
              class="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-8 py-3.5 text-xs font-bold text-white shadow-lg transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
              [disabled]="saving()"
            >
              @if (saving()) {
                <svg viewBox="0 0 24 24" fill="none" class="h-4 w-4 animate-spin text-white">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-25" />
                  <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
                </svg>
                Guardando…
              } @else {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="h-4 w-4">
                  <path d="m5 13 4 4L19 7" />
                </svg>
                {{ id() ? 'Guardar cambios' : 'Crear producto' }}
              }
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

  private lastToastTime = 0;

  private get draftKey(): string {
    const id = this.id();
    return id ? `firmeza-draft-product-edit-${id}` : 'firmeza-draft-product-new';
  }

  ngOnInit(): void {
    const id = this.id();
    if (!id) {
      this.restoreDraft();
      return;
    }

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
        this.restoreDraft();
      },
      error: (error) => {
        this.loading.set(false);
        const apiError = toApiError(error);
        this.errorMessage.set(apiError.message);
        void Swal.fire({
          icon: 'error',
          title: 'Error al cargar producto',
          text: apiError.message,
          confirmButtonColor: '#0284c7',
          confirmButtonText: 'Entendido'
        });
      }
    });
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
    queueMicrotask(() => {
      try {
        localStorage.setItem(this.draftKey, JSON.stringify(this.form));
      } catch {}
    });
  }

  @HostListener('window:beforeunload')
  protected onBeforeUnload(): void {
    try {
      localStorage.setItem(this.draftKey, JSON.stringify(this.form));
    } catch {}
  }

  protected clearDraft(): void {
    try {
      localStorage.removeItem(this.draftKey);
    } catch {}
  }

  private restoreDraft(): void {
    try {
      const raw = localStorage.getItem(this.draftKey);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data && typeof data === 'object') {
        this.form = {
          ...this.form,
          ...data
        };
      }
    } catch {}
  }

  protected fieldError(field: string): string | null {
    return this.fieldErrors()[field] ?? null;
  }

  protected onSubmit(): void {
    if (this.saving()) return;

    this.errorMessage.set(null);
    this.fieldErrors.set({});

    // Validaciones del formulario
    const sku = this.form.sku.trim();
    const name = this.form.name.trim();
    const category = this.form.category.trim();
    const unit = this.form.unit.trim();
    const price = Number(this.form.price);
    const stock = Number(this.form.stock);

    const errors: Record<string, string> = {};
    if (!sku) errors['sku'] = 'El código SKU es obligatorio.';
    if (!name) errors['name'] = 'El nombre del producto es obligatorio.';
    if (!category) errors['category'] = 'La categoría es obligatoria.';
    if (!unit) errors['unit'] = 'La unidad de medida es obligatoria.';
    if (isNaN(price) || price <= 0) errors['price'] = 'El precio debe ser un valor mayor a cero.';
    if (isNaN(stock) || stock < 0) errors['stock'] = 'El stock no puede ser negativo.';

    if (Object.keys(errors).length > 0) {
      this.fieldErrors.set(errors);
      const firstError = Object.values(errors)[0];
      this.errorMessage.set(firstError);

      void Swal.fire({
        icon: 'warning',
        title: 'Verifica los datos del producto',
        text: firstError,
        confirmButtonText: 'Revisar formulario',
        confirmButtonColor: '#0284c7',
        width: '420px'
      });
      return;
    }

    this.saving.set(true);

    const request: ProductRequest = {
      sku: sku.toUpperCase(),
      name,
      description: this.form.description.trim() || null,
      category,
      unit,
      price,
      stock,
      isActive: this.form.isActive
    };

    const id = this.id();
    const request$ = id ? this.productsService.update(id, request) : this.productsService.create(request);

    request$.subscribe({
      next: () => {
        this.clearDraft();
        AdminNotificationService.broadcastStockChanged(request.sku, 'ProductSaved');
        this.toastService.success(id ? 'Producto actualizado exitosamente.' : 'Producto creado exitosamente.');
        this.router.navigate(['/productos']);
      },
      error: (error) => {
        const apiError = toApiError(error);
        this.errorMessage.set(apiError.message);
        this.fieldErrors.set(apiError.fieldErrors);
        this.saving.set(false);

        void Swal.fire({
          icon: 'error',
          title: 'No se pudo guardar el producto',
          text: apiError.message,
          confirmButtonColor: '#0284c7',
          confirmButtonText: 'Entendido',
          width: '420px'
        });
      }
    });
  }
}
