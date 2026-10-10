import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CustomersService, CustomerSalesCount } from './customers.service';
import { API_URL } from './Api.Service';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('CustomersService', () => {
  let service: CustomersService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CustomersService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(CustomersService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('delete sin force no envía query param force', () => {
    const customerId = 'c123';

    service.delete(customerId).subscribe();

    const req = httpTesting.expectOne(`${API_URL}/customers/${customerId}`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.params.has('force')).toBe(false);
    req.flush(null);
  });

  it('delete con force=true envía query param force=true', () => {
    const customerId = 'c123';

    service.delete(customerId, true).subscribe();

    const req = httpTesting.expectOne(`${API_URL}/customers/${customerId}?force=true`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.params.get('force')).toBe('true');
    req.flush(null);
  });

  it('getSalesCount consulta el endpoint correcto y devuelve la cantidad de ventas', () => {
    const customerId = 'c123';
    const mockResponse: CustomerSalesCount = { salesCount: 5, hasSales: true };

    let result: CustomerSalesCount | undefined;
    service.getSalesCount(customerId).subscribe((res) => {
      result = res;
    });

    const req = httpTesting.expectOne(`${API_URL}/customers/${customerId}/sales-count`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);

    expect(result).toEqual(mockResponse);
  });
});
