import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './Api.Service';
import { PagedResponse } from './products.service';

export type CustomerSignupStatus = 'Pending' | 'Approved' | 'Rejected';

export interface CustomerSignup {
  id: string;
  userId: string;
  document: string;
  fullName: string;
  age: number;
  email: string;
  phone: string;
  address: string | null;
  status: CustomerSignupStatus;
  createdAt: string;
  reviewedAt: string | null;
  reviewedByUserId: string | null;
  customerId: string | null;
}

export interface CustomerSignupReview {
  id: string;
  status: CustomerSignupStatus;
  customerId: string | null;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerRequestsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_URL}/customer-requests`;

  list(
    status: CustomerSignupStatus = 'Pending',
    q?: string,
    page = 1,
    pageSize = 10
  ): Observable<PagedResponse<CustomerSignup>> {
    let params = new HttpParams().set('status', status).set('page', page).set('pageSize', pageSize);
    if (q) params = params.set('q', q);

    return this.http.get<PagedResponse<CustomerSignup>>(this.baseUrl, { params });
  }

  approve(id: string): Observable<CustomerSignupReview> {
    return this.http.post<CustomerSignupReview>(`${this.baseUrl}/${id}/approve`, {});
  }

  reject(id: string): Observable<CustomerSignupReview> {
    return this.http.post<CustomerSignupReview>(`${this.baseUrl}/${id}/reject`, {});
  }
}