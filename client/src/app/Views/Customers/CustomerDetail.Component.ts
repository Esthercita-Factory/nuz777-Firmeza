import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { toApiError } from '../../Services/Api.Service';
import { ConfirmService } from '../../Services/confirm.service';
import { Customer, CustomersService } from '../../Services/customers.service';
import { ToastService } from '../../Services/imports.service';
import { IconComponent } from '../Shared/Icon.Component';

@Component({
  selector: 'app-customer-detail',
  imports: [RouterLink, DatePipe, IconComponent],
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
          <span class="ml-3 text-sm font-semibold text-slate-500">Cargando cliente…</span>
        </div>
      }

      @if (customer(); as current) {
        <div class="flex flex-wrap items-center justify-between gap-3">
          <a routerLink="/clientes" class="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-500">
            <app-icon name="arrow-left" [size]="16" />
            Volver a clientes
          </a>
          <div class="flex items-center gap-2">
            <a
              [routerLink]="['/clientes', current.id, 'editar']"
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
            <p class="text-sm font-black uppercase tracking-[0.2em] text-sky-600">Ficha de cliente</p>
            <h1 class="mt-1 text-3xl font-black text-slate-950">{{ current.fullName }}</h1>
            <p class="mt-1 font-mono text-slate-500">{{ current.document }}</p>
          </div>
          <span
            class="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold ring-1"
            [class]="current.isActive ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-100 text-slate-500 ring-slate-200'"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true"></span>
            {{ current.isActive ? 'Activo' : 'Inactivo' }}
          </span>
        </div>

        <div class="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          <dl class="divide-y divide-slate-100 text-sm">
            <div class="grid gap-1 px-6 py-4 sm:grid-cols-3">
              <dt class="text-xs font-semibold uppercase tracking-wider text-slate-400">Correo</dt>
              <dd class="font-bold text-slate-900 sm:col-span-2">{{ current.email }}</dd>
            </div>
            <div class="grid gap-1 px-6 py-4 sm:grid-cols-3">
              <dt class="text-xs font-semibold uppercase tracking-wider text-slate-400">Teléfono</dt>
              <dd class="font-bold text-slate-900 sm:col-span-2">{{ current.phone }}</dd>
            </div>
            <div class="grid gap-1 px-6 py-4 sm:grid-cols-3">
              <dt class="text-xs font-semibold uppercase tracking-wider text-slate-400">Edad</dt>
              <dd class="font-bold text-slate-900 sm:col-span-2">{{ current.age }} años</dd>
            </div>
            <div class="grid gap-1 px-6 py-4 sm:grid-cols-3">
              <dt class="text-xs font-semibold uppercase tracking-wider text-slate-400">Dirección</dt>
              <dd class="font-bold text-slate-900 sm:col-span-2">{{ current.address || 'Sin dirección registrada.' }}</dd>
            </div>
            <div class="grid gap-1 px-6 py-4 sm:grid-cols-3">
              <dt class="text-xs font-semibold uppercase tracking-wider text-slate-400">Creado</dt>
              <dd class="font-bold text-slate-900 sm:col-span-2">{{ current.createdAt | date: 'dd/MM/yyyy HH:mm' }}</dd>
            </div>
            <div class="grid gap-1 px-6 py-4 sm:grid-cols-3">
              <dt class="text-xs font-semibold uppercase tracking-wider text-slate-400">Última actualización</dt>
              <dd class="font-bold text-slate-900 sm:col-span-2">{{ current.updatedAt ? (current.updatedAt | date: 'dd/MM/yyyy HH:mm') : 'Sin actualizaciones' }}</dd>
            </div>
          </dl>
        </div>
      }
    </div>
  `
})
export class CustomerDetailComponent implements OnInit {
  readonly id = input<string>();

  protected readonly customersService = inject(CustomersService);
  private readonly confirmService = inject(ConfirmService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly customer = signal<Customer | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.id();
    if (!id) return;

    this.loading.set(true);
    this.customersService.getById(id).subscribe({
      next: (customer) => {
        this.loading.set(false);
        this.customer.set(customer);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(toApiError(error).message);
      }
    });
  }

  protected async remove(customer: Customer): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Eliminar cliente',
      message: `¿Eliminar a ${customer.fullName}? Esta accion no se puede deshacer.`
    });
    if (!confirmed) return;

    this.customersService.delete(customer.id).subscribe({
      next: () => {
        this.toastService.success('Cliente eliminado.');
        this.router.navigate(['/clientes']);
      },
      error: (error) => this.toastService.error(toApiError(error).message)
    });
  }
}