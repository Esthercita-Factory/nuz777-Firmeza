import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, from, of, switchMap, throwError } from 'rxjs';
import { API_URL } from './Api.Service';

export interface ImportValidationEntry {
  sheetName: string;
  rowNumber: number;
  field: string;
  message: string;
  severity: 'Warning' | 'Error';
  rawValue: string | null;
}

export interface ImportResult {
  success: boolean;
  totalRowsProcessed: number;
  productsCreated: number;
  productsUpdated: number;
  customersCreated: number;
  customersUpdated: number;
  salesCreated: number;
  errors: ImportValidationEntry[];
  warnings: ImportValidationEntry[];
}

@Injectable({
  providedIn: 'root'
})
export class ImportsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_URL}/imports`;

  upload(file: File): Observable<ImportResult> {
    const form = new FormData();
    form.append('file', file, file.name);

    return this.http.post<ImportResult>(`${this.baseUrl}/excel`, form);
  }

  templateUrl(): string {
    return `${this.baseUrl}/template`;
  }

  /**
   * Descarga binaria (Excel, PDF, comprobantes). Usa el interceptor normal para que
   * la petición lleve el Bearer y se renueve el token si venció.
   */
  download(url: string, fallbackFileName: string): Observable<boolean> {
    return this.http.get(url, { responseType: 'blob', observe: 'response' }).pipe(
      switchMap((response) => {
        const contentType = response.headers.get('content-type') ?? '';

        // La API responde errores en JSON: guardarlos con nombre .xlsx produce un archivo corrupto.
        if (contentType.includes('application/json') || contentType.includes('text/html') || contentType.startsWith('text/')) {
          return from(response.body?.text() ?? Promise.resolve('')).pipe(
            switchMap((raw) => throwError(() => new Error(this.extractMessage(raw, response.status))))
          );
        }

        this.saveFile(response, fallbackFileName);
        return of(true);
      })
    );
  }

  private extractMessage(raw: string, status: number): string {
    try {
      const parsed = JSON.parse(raw);
      const message = parsed?.detail || parsed?.title || parsed?.message;
      if (message) {
        return String(message);
      }
    } catch {
      // La respuesta no era JSON.
    }

    return `No se pudo descargar el archivo (HTTP ${status}).`;
  }

  private saveFile(response: HttpResponse<Blob>, fallbackFileName: string): void {
    if (!response.body) return;

    const objectUrl = URL.createObjectURL(response.body);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = this.fileNameFrom(response.headers.get('content-disposition'), fallbackFileName);
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }

  private fileNameFrom(contentDisposition: string | null, fallback: string): string {
    const match = contentDisposition ? /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(contentDisposition) : null;
    return match ? decodeURIComponent(match[1]) : fallback;
  }
}

/** Avisos flotantes de la aplicación (sustituyen a TempData del panel Razor). */
@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly items = signal<{ id: number; kind: 'success' | 'error' | 'info'; message: string }[]>([]);
  private nextId = 1;

  readonly toasts = this.items.asReadonly();

  success(message: string): void {
    this.show('success', message);
  }

  error(message: string): void {
    this.show('error', message);
  }

  info(message: string): void {
    this.show('info', message);
  }

  dismiss(id: number): void {
    this.items.update((current) => current.filter((toast) => toast.id !== id));
  }

  private show(kind: 'success' | 'error' | 'info', message: string): void {
    const id = this.nextId++;
    this.items.update((current) => [...current, { id, kind, message }]);
    setTimeout(() => this.dismiss(id), kind === 'error' ? 8000 : 5000);
  }
}
