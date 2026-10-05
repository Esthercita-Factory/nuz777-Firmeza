import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toApiError } from '../../Services/Api.Service';
import { ConfirmService } from '../../Services/confirm.service';
import { PagedResponse } from '../../Services/products.service';
import { CustomerRequestsService, CustomerSignup } from '../../Services/customer-requests.service';
import { ToastService } from '../../Services/imports.service';
import { IconComponent } from '../Shared/Icon.Component';

@Component({
  selector: 'app-customer-requests',
  imports: [DatePipe, IconComponent, FormsModule],
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-sm font-black uppercase tracking-[0.2em] text-amber-600">Revisión de altas</p>
        <h1 class="mt-2 text-3xl font-black tracking-tight text-slate-950">Solicitudes de clientes</h1>
        <p class="mt-2 text-slate-500">
          Quien se registra en el portal queda pendiente. Al aprobar, el solicitante se agrega al listado de clientes; al descartar, no se agrega.
        </p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-blue-400 hover:text-blue-600"
        (click)="load()"
      >
        Actualizar
      </button>
    </div>

    <form class="mt-8 flex flex-wrap gap-3" (ngSubmit)="search()">
      <input
        name="q"
        [(ngModel)]="queryText"
        placeholder="Buscar por nombre, documento o correo..."
        class="min-w-[240px] flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      />
      <button type="submit" class="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800">Buscar</button>
    </form>

    @if (errorMessage(); as message) {
      <div class="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-800">{{ message }}</div>
    }

    @if (loading()) {
      <div class="mt-6 flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-20 shadow-sm">
        <svg viewBox="0 0 24 24" fill="none" class="h-8 w-8 animate-spin text-amber-500">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-25" />
          <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
        </svg>
        <span class="ml-3 text-sm font-semibold text-slate-500">Cargando solicitudes…</span>
      </div>
    }

    <div class="mt-6 space-y-4">
      @for (request of requests(); track request.id) {
        <article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="flex items-start gap-4">
              <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <app-icon name="user-plus" [size]="20" />
              </span>
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="text-base font-black text-slate-950">{{ request.fullName }}</h3>
                  <span class="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-800">Pendiente</span>
                </div>
                <p class="mt-1 font-mono text-xs font-bold text-slate-500">{{ request.document }}</p>
                <p class="mt-1 text-xs text-slate-500">
                  {{ request.age }} años · {{ request.phone }} · {{ request.email }}
                </p>
                @if (request.address) {
                  <p class="mt-1 text-xs text-slate-400">{{ request.address }}</p>
                }
                <p class="mt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Registrada {{ request.createdAt | date: 'dd/MM/yyyy HH:mm' }}
                </p>
              </div>
            </div>

            <div class="flex shrink-0 items-center gap-2">
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-rose-500"
                (click)="reject(request)"
              >
                <app-icon name="trash" [size]="14" />
                Descartar
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-500"
                (click)="approve(request)"
              >
                <app-icon name="check" [size]="14" />
                Aprobar
              </button>
            </div>
          </div>
        </article>
      } @empty {
        <div class="rounded-2xl border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
          <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
            <app-icon name="check" [size]="26" />
          </span>
          <p class="mt-4 text-sm font-bold text-slate-700">No hay solicitudes pendientes</p>
          <p class="mt-1 text-xs text-slate-400">Las nuevas solicitudes de registro aparecerán aquí automáticamente.</p>
        </div>
      }
    </div>

    @if (totalPages() > 1) {
      <div class="mt-6 flex items-center justify-between">
        <p class="text-xs font-semibold text-slate-500">Página {{ page() }} de {{ totalPages() }} · {{ totalCount() }} registros</p>
        <div class="flex gap-2">
          <button
            type="button"
            class="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 disabled:opacity-40"
            [disabled]="page() <= 1"
            (click)="goToPage(page() - 1)"
          >
            Anterior
          </button>
          <button
            type="button"
            class="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 disabled:opacity-40"
            [disabled]="page() >= totalPages()"
            (click)="goToPage(page() + 1)"
          >
            Siguiente
          </button>
        </div>
      </div>
    }
  `
})
export class CustomerRequestsComponent implements OnInit {
  private readonly requestsService = inject(CustomerRequestsService);
  private readonly confirmService = inject(ConfirmService);
  private readonly toastService = inject(ToastService);

  protected readonly requests = signal<CustomerSignup[]>([]);
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

  protected load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.requestsService.list('Pending', this.queryText.trim() || undefined, this.page()).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.requests.set(response.items);
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

  protected async approve(request: CustomerSignup): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Aprobar solicitud',
      message: `¿Agregar a ${request.fullName} (${request.document}) al listado de clientes?`,
      confirmLabel: 'Aprobar',
      tone: 'default'
    });
    if (!confirmed) return;

    this.requestsService.approve(request.id).subscribe({
      next: (review) => {
        this.toastService.success(review.message);
        this.load();
      },
      error: (error) => this.toastService.error(toApiError(error).message)
    });
  }

  protected async reject(request: CustomerSignup): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Descartar solicitud',
      message: `¿Descartar la solicitud de ${request.fullName} (${request.document})? No se agregará al listado de clientes.`,
      confirmLabel: 'Descartar'
    });
    if (!confirmed) return;

    this.requestsService.reject(request.id).subscribe({
      next: (review) => {
        this.toastService.success(review.message);
        this.load();
      },
      error: (error) => this.toastService.error(toApiError(error).message)
    });
  }
}