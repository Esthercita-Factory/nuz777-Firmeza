import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { toApiError } from '../../Services/Api.Service';
import { CustomerRequest, CustomersService } from '../../Services/customers.service';
import { ToastService } from '../../Services/imports.service';

@Component({
  selector: 'app-customer-form',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="mx-auto max-w-4xl">
      <a routerLink="/clientes" class="text-sm font-bold text-blue-600 hover:text-blue-500">← Volver a clientes</a>

      <h1 class="mt-4 text-3xl font-black text-slate-950">{{ id() ? 'Editar cliente' : 'Nuevo cliente' }}</h1>

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
            <label for="fullName" class="block text-sm font-bold text-slate-700">Nombre completo</label>
            <input
              id="fullName"
              name="fullName"
              [(ngModel)]="form.fullName"
              placeholder="Ej.: Ana Martínez López"
              class="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
            @if (fieldError('fullName'); as message) {
              <p class="text-xs text-rose-600">{{ message }}</p>
            }
          </div>

          <div class="space-y-1.5">
            <label for="document" class="block text-sm font-bold text-slate-700">Documento</label>
            <input
              id="document"
              name="document"
              [(ngModel)]="form.document"
              placeholder="Ej.: 1.234.567.890"
              class="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
            @if (fieldError('document'); as message) {
              <p class="text-xs text-rose-600">{{ message }}</p>
            }
          </div>

          <div class="space-y-1.5">
            <label for="age" class="block text-sm font-bold text-slate-700">Edad</label>
            <input
              id="age"
              name="age"
              type="number"
              min="18"
              max="120"
              [(ngModel)]="form.age"
              placeholder="Ej.: 30"
              class="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
            @if (fieldError('age'); as message) {
              <p class="text-xs text-rose-600">{{ message }}</p>
            }
          </div>

          <div class="space-y-1.5">
            <label for="phone" class="block text-sm font-bold text-slate-700">Teléfono</label>
            <input
              id="phone"
              name="phone"
              [(ngModel)]="form.phone"
              placeholder="Ej.: 300 123 4567"
              class="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
            @if (fieldError('phone'); as message) {
              <p class="text-xs text-rose-600">{{ message }}</p>
            }
          </div>

          <div class="space-y-1.5 sm:col-span-2">
            <label for="email" class="block text-sm font-bold text-slate-700">Correo</label>
            <input
              id="email"
              name="email"
              type="email"
              autocomplete="email"
              [(ngModel)]="form.email"
              placeholder="ejemplo@correo.com"
              class="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
            @if (fieldError('email'); as message) {
              <p class="text-xs text-rose-600">{{ message }}</p>
            }
          </div>

          <div class="space-y-1.5 sm:col-span-2">
            <label for="address" class="block text-sm font-bold text-slate-700">Dirección</label>
            <input
              id="address"
              name="address"
              [(ngModel)]="form.address"
              placeholder="Ej.: Cra. 10 # 20-30, Bogotá"
              class="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
            @if (fieldError('address'); as message) {
              <p class="text-xs text-rose-600">{{ message }}</p>
            }
          </div>

          <div class="flex items-center justify-between gap-5 rounded-xl bg-slate-50 p-4 sm:col-span-2">
            <div>
              <span class="block text-sm font-bold text-slate-700">Activo</span>
              <p class="text-xs text-slate-400">Los clientes inactivos no aparecen al registrar ventas.</p>
            </div>
            <input id="isActive" name="isActive" type="checkbox" [(ngModel)]="form.isActive" class="h-5 w-5 rounded border-slate-300 text-blue-500" />
          </div>
        </div>

        <div class="mt-8 flex justify-end gap-3">
          <a routerLink="/clientes" class="rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 shadow-sm">Cancelar</a>
          <button
            type="submit"
            class="rounded-xl bg-slate-950 px-8 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-blue-500 hover:text-slate-950 disabled:opacity-60"
            [disabled]="saving()"
          >
            {{ id() ? 'Guardar cambios' : 'Crear cliente' }}
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

  ngOnInit(): void {
    const id = this.id();
    if (!id) return;

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

    const request: CustomerRequest = {
      fullName: this.form.fullName.trim(),
      document: this.form.document.trim(),
      age: Number(this.form.age),
      email: this.form.email.trim(),
      phone: this.form.phone.trim(),
      address: this.form.address.trim() || null,
      isActive: this.form.isActive
    };

    const id = this.id();
    const request$ = id ? this.customersService.update(id, request) : this.customersService.create(request);

    request$.subscribe({
      next: () => {
        this.toastService.success(id ? 'Cliente actualizado.' : 'Cliente creado.');
        this.router.navigate(['/clientes']);
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
