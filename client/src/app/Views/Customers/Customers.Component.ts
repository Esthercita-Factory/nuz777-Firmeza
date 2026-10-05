import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../Shared/Icon.Component';
import { toApiError } from '../../Services/Api.Service';
import { ConfirmService } from '../../Services/confirm.service';
import { Customer, CustomersService } from '../../Services/customers.service';
import { ImportsService, ToastService } from '../../Services/imports.service';

@Component({
  selector: 'app-customers',
  imports: [IconComponent, FormsModule, RouterLink],
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-sm font-black uppercase tracking-[0.2em] text-blue-600">Relaciones</p>
        <h1 class="mt-2 text-3xl font-black tracking-tight text-slate-950">Clientes</h1>
        <p class="mt-2 text-slate-500">Información de las personas y negocios que confían en Firmeza.</p>
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
        <a routerLink="/clientes/nuevo" class="rounded-xl bg-blue-400 px-5 py-2.5 text-sm font-black text-slate-950 shadow-lg shadow-blue-100 transition hover:bg-blue-300">
          + Nuevo cliente
        </a>
      </div>
    </div>

    <form class="mt-8 flex flex-wrap gap-3" (ngSubmit)="search()">
      <input
        name="q"
        [(ngModel)]="queryText"
        placeholder="Buscar por nombre, documento o correo..."
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
              <th class="px-6 py-4">Cliente</th>
              <th class="px-6 py-4">Documento</th>
              <th class="px-6 py-4">Contacto</th>
              <th class="px-6 py-4">Edad</th>
              <th class="px-6 py-4">Estado</th>
              <th class="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @for (customer of customers(); track customer.id) {
              <tr [class]="customer.isActive ? 'hover:bg-blue-50/40' : 'bg-slate-50 text-slate-400'">
                <td class="px-6 py-4">
                  <p class="font-bold text-slate-900">{{ customer.fullName }}</p>
                  <p class="text-xs text-slate-500">{{ customer.email }}</p>
                </td>
                <td class="px-6 py-4 font-mono text-xs text-slate-600">{{ customer.document }}</td>
                <td class="px-6 py-4 text-slate-600">{{ customer.phone }}</td>
                <td class="px-6 py-4">{{ customer.age }} años</td>
                <td class="px-6 py-4">
                  <span class="rounded-full px-3 py-1 text-xs font-bold" [class]="customer.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'">
                    {{ customer.isActive ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center justify-end gap-1">
                    <a
                      [routerLink]="['/clientes', customer.id]"
                      title="Ver cliente"
                      class="rounded-lg p-2 text-slate-400 transition hover:bg-sky-50 hover:text-sky-600"
                    >
                      <app-icon name="eye" [size]="16" label="Ver cliente" />
                    </a>
                    <a
                      [routerLink]="['/clientes', customer.id, 'editar']"
                      title="Editar cliente"
                      class="rounded-lg p-2 text-slate-400 transition hover:bg-sky-50 hover:text-sky-600"
                    >
                      <app-icon name="pencil" [size]="16" label="Editar cliente" />
                    </a>
                    <button
                      type="button"
                      title="Eliminar cliente"
                      class="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      (click)="remove(customer)"
                    >
                      <app-icon name="trash" [size]="16" label="Eliminar cliente" />
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="px-6 py-14 text-center text-slate-500">No hay clientes que coincidan con la búsqueda.</td>
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
export class CustomersComponent implements OnInit {
  private readonly customersService = inject(CustomersService);
  private readonly importsService = inject(ImportsService);
  private readonly toastService = inject(ToastService);
  private readonly confirmService = inject(ConfirmService);

  protected readonly customers = signal<Customer[]>([]);
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

  protected async remove(customer: Customer): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Eliminar cliente',
      message: `¿Eliminar a ${customer.fullName}? Esta accion no se puede deshacer.`
    });
    if (!confirmed) return;

    this.customersService.delete(customer.id).subscribe({
      next: () => {
        this.toastService.success('Cliente eliminado.');
        this.load();
      },
      error: (error) => this.toastService.error(toApiError(error).message)
    });
  }

  protected exportFile(format: 'excel' | 'pdf'): void {
    const url = format === 'excel' ? this.customersService.exportExcelUrl() : this.customersService.exportPdfUrl();

    this.importsService.download(url, `clientes.${format === 'excel' ? 'xlsx' : 'pdf'}`).subscribe({
      next: () => this.toastService.success(`Clientes exportados (${format.toUpperCase()}).`),
      error: (error) => this.toastService.error(toApiError(error).message)
    });
  }

  private load(): void {
    this.customersService
      .list({
        q: this.queryText.trim() || undefined,
        onlyActive: this.onlyActive() ? true : undefined,
        page: this.page(),
        pageSize: 10
      })
      .subscribe({
        next: (response) => {
          this.customers.set(response.items);
          this.page.set(response.page);
          this.totalPages.set(response.totalPages);
          this.totalCount.set(response.totalCount);
        },
        error: (error) => this.errorMessage.set(toApiError(error).message)
      });
  }
}
