import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './Api.Service';
import { SaleStatus } from './sales.service';

export interface RecentSale {
  id: string;
  saleNumber: string;
  customerName: string;
  saleDate: string;
  total: number;
  status: SaleStatus;
}

export interface DashboardData {
  activeProductCount: number;
  activeCustomerCount: number;
  saleCount: number;
  salesTotal: number;
  recentSales: RecentSale[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_URL}/dashboard`;

  getDashboardData(): Observable<DashboardData> {
    return this.http.get<DashboardData>(this.baseUrl);
  }
}
