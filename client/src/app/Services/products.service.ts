import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './Api.Service';

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string;
  unit: string;
  price: number;
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface ProductRequest {
  sku: string;
  name: string;
  description: string | null;
  category: string;
  unit: string;
  price: number;
  stock: number;
  isActive: boolean;
}

export interface ProductQuery {
  q?: string;
  onlyActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface PagedResponse<TItem> {
  items: TItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_URL}/products`;

  list(query: ProductQuery = {}): Observable<PagedResponse<Product>> {
    return this.http.get<PagedResponse<Product>>(this.baseUrl, { params: this.toParams(query) });
  }

  getById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/${id}`);
  }

  create(request: ProductRequest): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, request);
  }

  update(id: string, request: ProductRequest): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  exportExcelUrl(): string {
    return `${this.baseUrl}/export/excel`;
  }

  exportPdfUrl(): string {
    return `${this.baseUrl}/export/pdf`;
  }

  private toParams(query: ProductQuery): HttpParams {
    let params = new HttpParams();
    if (query.q) params = params.set('q', query.q);
    if (query.onlyActive) params = params.set('onlyActive', 'true');
    if (query.page) params = params.set('page', query.page);
    if (query.pageSize) params = params.set('pageSize', query.pageSize);
    return params;
  }
}
