import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './Api.Service';
import { PagedResponse } from './products.service';

export type SaleStatus = 'Pending' | 'Confirmed' | 'Delivered' | 'Cancelled';

/** Tasa de IVA vigente. Debe coincidir con InventoryCalculator.TaxRate del dominio. */
export const TAX_RATE = 0.19;

export interface SaleSummary {
  id: string;
  saleNumber: string;
  customerId: string;
  customerName: string;
  saleDate: string;
  status: SaleStatus;
  total: number;
  lineCount: number;
}

export interface SaleLine {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface SaleTaxes {
  /** Base sin impuesto, derivada del total. */
  subtotalBase: number;
  /** IVA incluido en el total. */
  tax: number;
  /** Tasa aplicada, por ejemplo 0.19. */
  rate: number;
}

export interface Sale {
  id: string;
  saleNumber: string;
  customerId: string;
  customerName: string;
  customerDocument: string;
  saleDate: string;
  status: SaleStatus;
  total: number;
  /** Base e IVA ya calculados por la API. No se recalculan en el cliente. */
  taxes: SaleTaxes;
  createdByUserId: string | null;
  lines: SaleLine[];
}

export interface SaleLineRequest {
  productId: string;
  quantity: number;
  unitPrice: number | null;
}

export interface SaleRequest {
  customerId: string;
  status: SaleStatus | null;
  lines: SaleLineRequest[];
}

export interface SaleQuery {
  q?: string;
  status?: SaleStatus | null;
  page?: number;
  pageSize?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_URL}/sales`;

  list(query: SaleQuery = {}): Observable<PagedResponse<SaleSummary>> {
    let params = new HttpParams();
    if (query.q) params = params.set('q', query.q);
    if (query.status) params = params.set('status', query.status);
    if (query.page) params = params.set('page', query.page);
    if (query.pageSize) params = params.set('pageSize', query.pageSize);

    return this.http.get<PagedResponse<SaleSummary>>(this.baseUrl, { params });
  }

  getById(id: string): Observable<Sale> {
    return this.http.get<Sale>(`${this.baseUrl}/${id}`);
  }

  create(request: SaleRequest): Observable<Sale> {
    return this.http.post<Sale>(this.baseUrl, request);
  }

  update(id: string, request: SaleRequest): Observable<Sale> {
    return this.http.put<Sale>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  receiptUrl(id: string): string {
    return `${this.baseUrl}/${id}/receipt`;
  }

  exportExcelUrl(): string {
    return `${this.baseUrl}/export/excel`;
  }

  exportPdfUrl(): string {
    return `${this.baseUrl}/export/pdf`;
  }

  /**
   * Separa un total con IVA incluido en base e impuesto, con el mismo redondeo
   * que usa InventoryCalculator en el dominio (AwayFromZero a 2 decimales).
   * Solo para el preview del formulario: una vez guardada, la venta trae la
   * base y el IVA calculados por la API en `taxes`.
   */
  splitTaxInclusive(total: number): SaleTaxes {
    const scale = 100;
    const rounded = (value: number) => Math.round(Math.abs(value) * scale + Number.EPSILON) / scale * Math.sign(value);
    const subtotalBase = rounded(total / (1 + TAX_RATE));

    return { subtotalBase, tax: rounded(total - subtotalBase), rate: TAX_RATE };
  }

  statusLabel(status: SaleStatus): string {
    switch (status) {
      case 'Pending':
        return 'Pendiente';
      case 'Confirmed':
        return 'Confirmada';
      case 'Delivered':
        return 'Entregada';
      case 'Cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  }

  statusClass(status: SaleStatus): string {
    switch (status) {
      case 'Pending':
        return 'bg-blue-50 text-blue-700 ring-blue-200';
      case 'Confirmed':
        return 'bg-sky-50 text-sky-700 ring-sky-200';
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 ring-rose-200';
      default:
        return 'bg-slate-100 text-slate-600 ring-slate-200';
    }
  }
}
