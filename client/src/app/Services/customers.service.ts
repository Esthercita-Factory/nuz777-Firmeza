import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_URL } from './Api.Service';
import { PagedResponse } from './products.service';

export interface Customer {
  id: string;
  document: string;
  fullName: string;
  age: number;
  email: string;
  phone: string;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface CustomerRequest {
  document: string;
  fullName: string;
  age: number;
  email: string;
  phone: string;
  address: string | null;
  isActive: boolean;
}

export interface CustomerQuery {
  q?: string;
  onlyActive?: boolean;
  page?: number;
  pageSize?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CustomersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_URL}/customers`;

  list(query: CustomerQuery = {}): Observable<PagedResponse<Customer>> {
    let params = new HttpParams();
    if (query.q) params = params.set('q', query.q);
    if (query.onlyActive) params = params.set('onlyActive', 'true');
    if (query.page) params = params.set('page', query.page);
    if (query.pageSize) params = params.set('pageSize', query.pageSize);

    return this.http.get<PagedResponse<Customer>>(this.baseUrl, { params });
  }

  getById(id: string): Observable<Customer> {
    return this.http.get<Customer>(`${this.baseUrl}/${id}`);
  }

  create(request: CustomerRequest): Observable<Customer> {
    return this.http.post<Customer>(this.baseUrl, request);
  }

  update(id: string, request: CustomerRequest): Observable<Customer> {
    return this.http.put<Customer>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  activeOptions(): Observable<Customer[]> {
    return this.list({ onlyActive: true, pageSize: 100 }).pipe(map((page) => page.items));
  }

  exportExcelUrl(): string {
    return `${this.baseUrl}/export/excel`;
  }

  exportPdfUrl(): string {
    return `${this.baseUrl}/export/pdf`;
  }
}
