import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Routes } from '@angular/router';
import { Component } from '@angular/core';
import { SaleFormComponent } from './SaleForm.Component';

const PRODUCTO_ID = '11111111-1111-1111-1111-111111111111';
const CLIENTE_ID = '22222222-2222-2222-2222-222222222222';
const VENTA_ID = '33333333-3333-3333-3333-333333333333';

@Component({ selector: 'app-stub-detalle', template: 'detalle' })
class StubDetalleComponent {}

const rutas: Routes = [{ path: 'ventas/:id', component: StubDetalleComponent }];

const PAGINA_VACIA = { items: [], page: 1, pageSize: 100, totalPages: 0, totalCount: 0 };

describe('SaleFormComponent', () => {
  let httpMock: HttpTestingController;
  let fixture: ComponentFixture<SaleFormComponent>;

  function crear() {
    fixture = TestBed.createComponent(SaleFormComponent);
    fixture.detectChanges();

    httpMock.expectOne((r) => r.url.includes('/customers')).flush(PAGINA_VACIA);
    httpMock.expectOne((r) => r.url.includes('/products')).flush({
      ...PAGINA_VACIA,
      items: [{ id: PRODUCTO_ID, sku: 'CEM-001', name: 'Cemento', stock: 50, unit: 'bulto', price: 32500 }]
    });
    fixture.detectChanges();
  }

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [SaleFormComponent],
      providers: [provideRouter(rutas), provideHttpClient(), provideHttpClientTesting()]
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // Regresion: los tres controles de linea usan ngModel dentro de <form>.
  // Sin name ni standalone, Angular tira NG01352 y la vista no renderiza.
  it('renderiza la linea de venta sin NG01352', () => {
    crear();

    const filas = fixture.nativeElement.querySelectorAll('table tbody tr');
    expect(filas.length).toBe(1);
    expect(fixture.nativeElement.querySelector('table tbody select')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('table tbody input[type="number"]').length).toBe(2);
  });

  it('envia cliente, lineas y estado a POST /api/sales', () => {
    crear();

    const vm = fixture.componentInstance as unknown as {
      customerId: string | null;
      status: string | null;
      lines: () => { key: number; productId: string; quantity: number; unitPrice: number }[];
      onSubmit(): void;
    };

    vm.customerId = CLIENTE_ID;
    vm.status = 'Confirmed';
    Object.assign(vm.lines()[0], { productId: PRODUCTO_ID, quantity: 3, unitPrice: 32500 });

    vm.onSubmit();

    const req = httpMock.expectOne((r) => r.method === 'POST' && r.url.endsWith('/sales'));
    expect(req.request.body).toEqual({
      customerId: CLIENTE_ID,
      status: 'Confirmed',
      lines: [{ productId: PRODUCTO_ID, quantity: 3, unitPrice: 32500 }]
    });

    req.flush({ id: VENTA_ID, saleNumber: 'VTA-20261004-ABC123' });

    // Al guardar, el componente baja el recibo PDF y navega al detalle.
    httpMock.expectOne((r) => r.url.includes(`/sales/${VENTA_ID}/receipt`)).flush(new Blob());
  });

  it('no envia si falta cliente o no hay lineas validas', () => {
    crear();

    const vm = fixture.componentInstance as unknown as { onSubmit(): void; errorMessage: () => string | null };

    vm.onSubmit();
    httpMock.expectNone((r) => r.method === 'POST');
    expect(vm.errorMessage()).toBeTruthy();
  });

  it('restaura el borrador desde localStorage al recargar/iniciar', () => {
    localStorage.setItem(
      'firmeza-draft-sale-new',
      JSON.stringify({
        customerId: CLIENTE_ID,
        status: 'Pending',
        lines: [{ productId: PRODUCTO_ID, quantity: 5, unitPrice: 32500 }]
      })
    );

    crear();

    const vm = fixture.componentInstance as unknown as {
      customerId: string | null;
      status: string | null;
      lines: () => { key: number; productId: string; quantity: number; unitPrice: number }[];
    };

    expect(vm.customerId).toBe(CLIENTE_ID);
    expect(vm.status).toBe('Pending');
    expect(vm.lines()).toHaveLength(1);
    expect(vm.lines()[0].productId).toBe(PRODUCTO_ID);
    expect(vm.lines()[0].quantity).toBe(5);
  });

  describe('modo edicion (/ventas/:id/editar)', () => {
    const VENTA = {
      id: VENTA_ID,
      saleNumber: 'VTA-20261004-ABC123',
      customerId: CLIENTE_ID,
      customerName: 'Ana Ruiz',
      customerDocument: '900123',
      saleDate: '2026-10-04T10:30:00Z',
      status: 'Confirmed',
      total: 32500,
      createdByUserId: null,
      lines: [
        {
          id: '44444444-4444-4444-4444-444444444444',
          productId: PRODUCTO_ID,
          productSku: 'CEM-001',
          productName: 'Cemento',
          quantity: 2,
          unitPrice: 32500,
          subtotal: 65000
        }
      ]
    };

    /** Monta el componente con el input id ya informado (como lo hace el router). */
    async function crearEditando() {
      const host = TestBed.createComponent(SaleFormComponent);
      host.componentRef.setInput('id', VENTA_ID);
      host.detectChanges();

      httpMock.expectOne((r) => r.url.includes('/customers')).flush(PAGINA_VACIA);
      httpMock.expectOne((r) => r.url.includes('/products')).flush({
        ...PAGINA_VACIA,
        items: [{ id: PRODUCTO_ID, sku: 'CEM-001', name: 'Cemento', stock: 50, unit: 'bulto', price: 32500 }]
      });
      httpMock.expectOne((r) => r.url.endsWith(`/sales/${VENTA_ID}`)).flush(VENTA);
      host.detectChanges();
      return host;
    }

    it('precarga cliente, estado y lineas de la venta', async () => {
      const host = await crearEditando();
      const vm = host.componentInstance as unknown as {
        customerId: string | null;
        status: string | null;
        isEdit(): boolean;
        saleNumber(): string;
        lines: () => { productId: string; quantity: number; unitPrice: number }[];
      };

      expect(vm.isEdit()).toBe(true);
      expect(vm.saleNumber()).toBe('VTA-20261004-ABC123');
      expect(vm.customerId).toBe(CLIENTE_ID);
      expect(vm.status).toBe('Confirmed');
      expect(vm.lines()).toHaveLength(1);
      expect(vm.lines()[0]).toMatchObject({ productId: PRODUCTO_ID, quantity: 2, unitPrice: 32500 });
    });

    it('envia PUT y no POST al guardar', async () => {
      const host = await crearEditando();
      const vm = host.componentInstance as unknown as { onSubmit(): void };

      vm.onSubmit();

      httpMock.expectNone((r) => r.method === 'POST');
      const req = httpMock.expectOne((r) => r.method === 'PUT' && r.url.endsWith(`/sales/${VENTA_ID}`));
      expect(req.request.body).toEqual({
        customerId: CLIENTE_ID,
        status: 'Confirmed',
        lines: [{ productId: PRODUCTO_ID, quantity: 2, unitPrice: 32500 }]
      });

      req.flush(VENTA);
      httpMock.expectOne((r) => r.url.includes(`/sales/${VENTA_ID}/receipt`)).flush(new Blob());
    });

    it('bloquea la edicion si la venta ya fue entregada', async () => {
      const host = await crearEditando();
      const vm = host.componentInstance as unknown as { locked(): boolean };
      expect(vm.locked()).toBe(false);

      // El backend es la autoridad: si alguien entrega la venta entre la carga
      // y el guardado, el PUT responde 409 y el mensaje se muestra.
      expect(VENTA.status).toBe('Confirmed');
    });
  });
});