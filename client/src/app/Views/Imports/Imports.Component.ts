import { Component, inject, signal } from '@angular/core';
import { toApiError } from '../../Services/Api.Service';
import { ImportResult, ImportsService, ToastService } from '../../Services/imports.service';

@Component({
  selector: 'app-imports',
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-sm font-black uppercase tracking-[0.2em] text-blue-600">Procesamiento automático</p>
        <h1 class="mt-2 text-3xl font-black tracking-tight text-slate-950">Carga masiva de datos</h1>
        <p class="mt-2 text-slate-500">Importa datos desnormalizados o mezclados mediante archivos Excel (.xlsx).</p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-400 hover:text-blue-600"
        (click)="downloadTemplate()"
      >
        <svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" viewBox="0 0 24 24" class="h-4 w-4 text-emerald-600">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Descargar plantilla (.xlsx)
      </button>
    </div>

    @if (errorMessage(); as message) {
      <div class="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-800">{{ message }}</div>
    }

    <div class="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div class="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <h2 class="flex items-center gap-2 text-lg font-black text-slate-950">
          <svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" class="h-5 w-5 text-blue-500">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Seleccionar archivo Excel
        </h2>

        <div class="mt-6 flex justify-center rounded-2xl border-2 border-dashed border-slate-200 px-6 py-10 transition hover:border-blue-400 hover:bg-blue-50/20">
          <div class="text-center">
            <svg fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" class="mx-auto h-12 w-12 text-slate-400">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M12 18v-6" />
              <path d="m9 15 3-3 3 3" />
            </svg>
            <div class="mt-4 flex justify-center text-sm leading-6 text-slate-600">
              <label class="cursor-pointer rounded-md font-bold text-blue-600 hover:text-blue-500">
                Selecciona un archivo
                <input type="file" accept=".xlsx" class="sr-only" (change)="onFileSelected($event)" />
              </label>
              <p class="pl-1">o arrástralo aquí</p>
            </div>
            <p class="text-xs text-slate-400">Archivos soportados: Microsoft Excel (.xlsx)</p>
            @if (fileName(); as name) {
              <p class="mt-2 text-xs font-bold text-slate-700">Archivo seleccionado: {{ name }}</p>
            }
          </div>
        </div>

        <button
          type="button"
          class="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 py-3.5 text-center text-sm font-bold text-white shadow-lg transition hover:bg-blue-500 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
          [disabled]="!file() || uploading()"
          (click)="upload()"
        >
          <svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" viewBox="0 0 24 24" class="h-4 w-4">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          {{ uploading() ? 'Procesando…' : 'Procesar y normalizar datos' }}
        </button>
      </div>

      <div class="space-y-4">
        <div class="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50/80 to-blue-100/60 p-6">
          <h3 class="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-blue-900">
            <svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" class="h-4 w-4 text-blue-600">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            ¿Cómo funciona la desnormalización?
          </h3>
          <ul class="mt-4 space-y-3 text-xs leading-5 text-blue-950">
            <li><strong>Tablas mezcladas:</strong> si el archivo tiene columnas de clientes y productos en la misma fila, el sistema las divide.</li>
            <li><strong>Normalización en memoria:</strong> agrupa clientes por documento y productos por código antes de guardar.</li>
            <li><strong>Upsert:</strong> si el registro ya existe se actualiza; si es nuevo, se inserta.</li>
            <li><strong>Validación estricta:</strong> precios ≥ 0, stock numérico, nombres y documentos requeridos.</li>
          </ul>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="text-xs font-black uppercase tracking-wider text-slate-500">Columnas reconocidas automáticamente</h3>
          <div class="mt-3 flex flex-wrap gap-1.5 text-[11px]">
            @for (column of recognizedColumns; track column) {
              <span class="rounded-lg bg-slate-100 px-2.5 py-1 font-mono font-medium text-slate-700">{{ column }}</span>
            }
          </div>
        </div>
      </div>
    </div>

    @if (result(); as summary) {
      <div class="mt-12">
        <h2 class="flex items-center gap-2 text-xl font-black text-slate-950">
          <svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" class="h-5 w-5 text-blue-500">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <path d="M2 10h20" />
          </svg>
          Resultados del procesamiento
        </h2>

        <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p class="text-xs font-bold text-slate-400">Total filas leídas</p>
            <p class="mt-2 text-3xl font-black text-slate-900">{{ summary.totalRowsProcessed }}</p>
          </div>
          <div class="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-sm">
            <p class="text-xs font-bold text-emerald-700">Productos (nuevos / act.)</p>
            <p class="mt-2 text-3xl font-black text-emerald-900">{{ summary.productsCreated }} / {{ summary.productsUpdated }}</p>
          </div>
          <div class="rounded-2xl border border-sky-100 bg-sky-50/50 p-5 shadow-sm">
            <p class="text-xs font-bold text-sky-700">Clientes (nuevos / act.)</p>
            <p class="mt-2 text-3xl font-black text-sky-900">{{ summary.customersCreated }} / {{ summary.customersUpdated }}</p>
          </div>
          <div class="rounded-2xl border border-blue-100 bg-blue-50/50 p-5 shadow-sm">
            <p class="text-xs font-bold text-blue-700">Ventas registradas</p>
            <p class="mt-2 text-3xl font-black text-blue-900">{{ summary.salesCreated }}</p>
          </div>
        </div>

        @if (entries().length > 0) {
          <div class="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h3 class="font-bold text-slate-900">Log de inconsistencias y errores detectados</h3>
            <p class="text-xs text-slate-500">
              Se encontraron {{ summary.errors.length }} errores y {{ summary.warnings.length }} advertencias.
            </p>

            <ul class="mt-4 space-y-2">
              @for (entry of entries(); track $index) {
                <li class="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-xs">
                  <span
                    class="rounded-full px-2.5 py-0.5 text-[10px] font-black"
                    [class]="entry.severity === 'Error' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-800'"
                  >
                    {{ entry.severity === 'Error' ? 'ERROR' : 'ADVERTENCIA' }}
                  </span>
                  <span class="font-mono font-bold text-slate-900">Fila {{ entry.rowNumber }}</span>
                  <span class="font-semibold text-slate-700">{{ entry.field }}</span>
                  <span class="text-slate-600">{{ entry.message }}</span>
                </li>
              }
            </ul>
          </div>
        }
      </div>
    }
  `
})
export class ImportsComponent {
  private readonly importsService = inject(ImportsService);
  private readonly toastService = inject(ToastService);

  protected readonly recognizedColumns = [
    'Código / SKU',
    'Producto / Nombre',
    'Precio / Costo',
    'Stock',
    'Documento / Cédula',
    'Cliente / Nombre',
    'Teléfono',
    'Correo',
    'Cantidad'
  ];

  protected readonly file = signal<File | null>(null);
  protected readonly fileName = signal<string | null>(null);
  protected readonly uploading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly result = signal<ImportResult | null>(null);
  protected readonly entries = signal<ImportResult['errors']>([]);

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selected = input.files?.[0] ?? null;

    this.file.set(selected);
    this.fileName.set(selected?.name ?? null);
    this.errorMessage.set(null);
  }

  protected upload(): void {
    const file = this.file();
    if (!file || this.uploading()) return;

    this.uploading.set(true);
    this.errorMessage.set(null);

    this.importsService.upload(file).subscribe({
      next: (result) => {
        this.result.set(result);
        this.entries.set([...result.errors, ...result.warnings]);
        this.uploading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(toApiError(error).message);
        this.uploading.set(false);
      }
    });
  }

  protected downloadTemplate(): void {
    this.importsService.download(this.importsService.templateUrl(), 'plantilla_carga_masiva_firmeza.xlsx').subscribe({
      next: () => this.toastService.success('Plantilla descargada.'),
      error: (error) => this.toastService.error(toApiError(error).message)
    });
  }
}
