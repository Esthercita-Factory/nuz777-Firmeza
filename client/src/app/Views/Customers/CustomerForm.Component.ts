import { Component, HostListener, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { toApiError } from '../../Services/Api.Service';
import { CustomerRequest, CustomersService } from '../../Services/customers.service';
import { ToastService } from '../../Services/imports.service';

@Component({
  selector: 'app-customer-form',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="mx-auto max-w-4xl space-y-6">
      <!-- CABECERA PROFESIONAL CON BREADCRUMB -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div class="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/80 px-3 py-1 text-xs font-bold text-blue-700 shadow-2xs">
            <span class="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            Directorio & Clientes
          </div>
          <h1 class="text-3xl font-black tracking-tight text-slate-950">
            {{ id() ? 'Editar cliente' : 'Nuevo cliente' }}
          </h1>
          <p class="mt-1 text-xs text-slate-500">
            Registra los datos de identificación y contacto para pedidos y facturación.
          </p>
        </div>
        <a
          routerLink="/clientes"
          (click)="clearDraft()"
          class="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Volver a clientes
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
          <span class="ml-3 text-sm font-semibold text-slate-600">Cargando datos del cliente…</span>
        </div>
      } @else {
        <form
          class="space-y-6"
          (ngSubmit)="onSubmit()"
          (input)="saveDraft()"
          (change)="saveDraft()"
        >
          <!-- SECCIÓN 1: DATOS PERSONALES Y DOCUMENTACIÓN -->
          <div class="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
            <div class="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
              <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold text-sm">
                1
              </span>
              <div>
                <h2 class="text-sm font-black text-slate-900">Identificación Personal</h2>
                <p class="text-xs text-slate-400">Nombre completo, número de cédula o NIT y edad legal.</p>
              </div>
            </div>

            <div class="grid gap-6 sm:grid-cols-2">
              <!-- Nombre completo -->
              <div class="space-y-1.5 sm:col-span-2">
                <label for="fullName" class="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Nombre completo <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <input
                    id="fullName"
                    name="fullName"
                    [(ngModel)]="form.fullName"
                    placeholder="Ej.: Ana María Gómez López"
                    class="w-full rounded-xl border border-slate-300 bg-slate-50/50 pl-11 pr-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    [class.border-rose-400]="fieldError('fullName')"
                  />
                </div>
                @if (fieldError('fullName'); as message) {
                  <p class="text-xs font-medium text-rose-600 flex items-center gap-1">
                    <span class="h-1 w-1 rounded-full bg-rose-600"></span>{{ message }}
                  </p>
                }
              </div>

              <!-- Documento -->
              <div class="space-y-1.5">
                <label for="document" class="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Cédula / Documento <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                      <rect width="18" height="14" x="3" y="5" rx="2" />
                      <circle cx="9" cy="11" r="2" />
                      <path d="M15 9h2M15 13h2" />
                    </svg>
                  </span>
                  <input
                    id="document"
                    name="document"
                    [(ngModel)]="form.document"
                    (keydown)="onNumericKeyDown($event, 'el documento')"
                    placeholder="Ej.: 1020304050"
                    class="w-full rounded-xl border border-slate-300 bg-slate-50/50 pl-11 pr-4 py-3 text-sm font-mono font-bold text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    [class.border-rose-400]="fieldError('document')"
                  />
                </div>
                @if (fieldError('document'); as message) {
                  <p class="text-xs font-medium text-rose-600 flex items-center gap-1">
                    <span class="h-1 w-1 rounded-full bg-rose-600"></span>{{ message }}
                  </p>
                }
              </div>

              <!-- Edad -->
              <div class="space-y-1.5">
                <label for="age" class="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Edad (mínimo 18) <span class="text-rose-500">*</span>
                </label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  min="18"
                  max="120"
                  [(ngModel)]="form.age"
                  (keydown)="onNumericKeyDown($event, 'la edad')"
                  placeholder="Ej.: 32"
                  class="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  [class.border-rose-400]="fieldError('age')"
                />
                @if (fieldError('age'); as message) {
                  <p class="text-xs font-medium text-rose-600 flex items-center gap-1">
                    <span class="h-1 w-1 rounded-full bg-rose-600"></span>{{ message }}
                  </p>
                }
              </div>
            </div>
          </div>

          <!-- SECCIÓN 2: CONTACTO Y UBICACIÓN -->
          <div class="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
            <div class="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
              <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 font-bold text-sm">
                2
              </span>
              <div>
                <h2 class="text-sm font-black text-slate-900">Canales de Contacto y Despacho</h2>
                <p class="text-xs text-slate-400">Teléfono para confirmaciones, correo electrónico y dirección física.</p>
              </div>
            </div>

            <div class="grid gap-6 sm:grid-cols-2">
              <!-- Teléfono -->
              <div class="space-y-1.5">
                <label for="phone" class="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Teléfono / Celular <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </span>
                  <input
                    id="phone"
                    name="phone"
                    [(ngModel)]="form.phone"
                    (keydown)="onNumericKeyDown($event, 'el teléfono')"
                    placeholder="Ej.: 300 123 4567"
                    class="w-full rounded-xl border border-slate-300 bg-slate-50/50 pl-11 pr-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    [class.border-rose-400]="fieldError('phone')"
                  />
                </div>
                @if (fieldError('phone'); as message) {
                  <p class="text-xs font-medium text-rose-600 flex items-center gap-1">
                    <span class="h-1 w-1 rounded-full bg-rose-600"></span>{{ message }}
                  </p>
                }
              </div>

              <!-- Correo -->
              <div class="space-y-1.5">
                <label for="email" class="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Correo electrónico <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autocomplete="email"
                    [(ngModel)]="form.email"
                    placeholder="cliente@ejemplo.com"
                    class="w-full rounded-xl border border-slate-300 bg-slate-50/50 pl-11 pr-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    [class.border-rose-400]="fieldError('email')"
                  />
                </div>
                @if (fieldError('email'); as message) {
                  <p class="text-xs font-medium text-rose-600 flex items-center gap-1">
                    <span class="h-1 w-1 rounded-full bg-rose-600"></span>{{ message }}
                  </p>
                }
              </div>

              <!-- Dirección -->
              <div class="space-y-1.5 sm:col-span-2">
                <label for="address" class="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Dirección de despacho / obra
                </label>
                <div class="relative">
                  <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </span>
                  <input
                    id="address"
                    name="address"
                    [(ngModel)]="form.address"
                    placeholder="Ej.: Cra. 15 # 85-30 Torre 2 Of. 401, Bogotá"
                    class="w-full rounded-xl border border-slate-300 bg-slate-50/50 pl-11 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- SECCIÓN 3: ESTADO DEL CLIENTE -->
          <div class="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
            <div class="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
              <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 font-bold text-sm">
                3
              </span>
              <div>
                <h2 class="text-sm font-black text-slate-900">Estado de la Cuenta</h2>
                <p class="text-xs text-slate-400">Disponibilidad del cliente para nuevas transacciones comerciales.</p>
              </div>
            </div>

            <div class="flex items-center justify-between gap-5 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 transition">
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold text-slate-900">Cliente activo</span>
                  <span
                    class="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    [class]="form.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'"
                  >
                    {{ form.isActive ? 'Habilitado' : 'Inactivo' }}
                  </span>
                </div>
                <p class="mt-0.5 text-xs text-slate-500">
                  Los clientes inactivos se preservan en el histórico pero no aparecen para crear nuevas órdenes de compra.
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

          <!-- BOTONES DE ACCIÓN -->
          <div class="flex flex-wrap items-center justify-end gap-3 pt-2">
            <a
              routerLink="/clientes"
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
                {{ id() ? 'Guardar cambios' : 'Crear cliente' }}
              }
            </button>
          </div>
        </form>
      }
    </div>
  `
})
export class CustomerFormComponent implements OnInit {
  readonly id = input<string>();

  private readonly customersService = inject(CustomersService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  protected form = {
    fullName: '',
    document: '',
    age: 18,
    email: '',
    phone: '',
    address: '',
    isActive: true
  };

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly fieldErrors = signal<Record<string, string>>({});

  private lastToastTime = 0;

  private get draftKey(): string {
    const id = this.id();
    return id ? `firmeza-draft-customer-edit-${id}` : 'firmeza-draft-customer-new';
  }

  ngOnInit(): void {
    const id = this.id();
    if (!id) {
      this.restoreDraft();
      return;
    }

    this.loading.set(true);
    this.customersService.getById(id).subscribe({
      next: (customer) => {
        this.loading.set(false);
        this.form = {
          fullName: customer.fullName,
          document: customer.document,
          age: customer.age,
          email: customer.email,
          phone: customer.phone,
          address: customer.address ?? '',
          isActive: customer.isActive
        };
        this.restoreDraft();
      },
      error: (error) => {
        this.loading.set(false);
        const apiError = toApiError(error);
        this.errorMessage.set(apiError.message);
        void Swal.fire({
          icon: 'error',
          title: 'Error al cargar cliente',
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

  protected onNumericKeyDown(event: KeyboardEvent, fieldName: string): void {
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

    const fullName = this.form.fullName.trim();
    const document = this.form.document.trim();
    const email = this.form.email.trim();
    const phone = this.form.phone.trim();
    const age = Number(this.form.age);

    const errors: Record<string, string> = {};
    if (!fullName || fullName.length < 3) {
      errors['fullName'] = 'El nombre completo debe tener al menos 3 caracteres.';
    }
    if (!document || document.length < 5) {
      errors['document'] = 'El documento es obligatorio (mínimo 5 dígitos).';
    }
    if (isNaN(age) || age < 18 || age > 120) {
      errors['age'] = 'La edad debe estar entre 18 y 120 años.';
    }
    if (!phone || phone.length < 7) {
      errors['phone'] = 'El teléfono debe contener al menos 7 dígitos.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      errors['email'] = 'Ingresa un correo electrónico válido.';
    }

    if (Object.keys(errors).length > 0) {
      this.fieldErrors.set(errors);
      const firstError = Object.values(errors)[0];
      this.errorMessage.set(firstError);

      void Swal.fire({
        icon: 'warning',
        title: 'Verifica los datos del cliente',
        text: firstError,
        confirmButtonText: 'Revisar formulario',
        confirmButtonColor: '#0284c7',
        width: '420px'
      });
      return;
    }

    this.saving.set(true);

    const request: CustomerRequest = {
      fullName,
      document,
      age,
      email,
      phone,
      address: this.form.address.trim() || null,
      isActive: this.form.isActive
    };

    const id = this.id();
    const request$ = id ? this.customersService.update(id, request) : this.customersService.create(request);

    request$.subscribe({
      next: () => {
        this.clearDraft();
        this.toastService.success(id ? 'Cliente actualizado exitosamente.' : 'Cliente creado exitosamente.');
        this.router.navigate(['/clientes']);
      },
      error: (error) => {
        const apiError = toApiError(error);
        this.errorMessage.set(apiError.message);
        this.fieldErrors.set(apiError.fieldErrors);
        this.saving.set(false);

        void Swal.fire({
          icon: 'error',
          title: 'No se pudo guardar el cliente',
          text: apiError.message,
          confirmButtonColor: '#0284c7',
          confirmButtonText: 'Entendido',
          width: '420px'
        });
      }
    });
  }
}
