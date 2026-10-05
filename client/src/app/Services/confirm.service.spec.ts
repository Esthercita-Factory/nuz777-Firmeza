import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ConfirmService } from './confirm.service';
import { SalesService } from './sales.service';
import { ConfirmDialogComponent } from '../Views/Shared/ConfirmDialog.Component';

describe('SalesService.splitTaxInclusive', () => {
  // splitTaxInclusive es pura, pero la clase se construye con inject(), asi que
  // necesita un contexto de inyeccion.
  let service: SalesService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(SalesService);
  });

  it('parte un total exacto', () => {
    const taxes = service.splitTaxInclusive(119);

    expect(taxes.subtotalBase).toBe(100);
    expect(taxes.tax).toBe(19);
    expect(taxes.rate).toBe(0.19);
  });

  it('base mas IVA siempre cuadra con el total', () => {
    // Mismo criterio que InventoryCalculatorTaxTests del lado del dominio.
    for (const total of [1, 7, 32500, 885000, 195000, 10150.55, 0.01, 99999.99]) {
      const taxes = service.splitTaxInclusive(total);
      expect(Number((taxes.subtotalBase + taxes.tax).toFixed(2))).toBe(total);
    }
  });

  it('redondea la base igual que el dominio', () => {
    // 325000 / 1.19 = 273109.2436... -> 273109.24
    const taxes = service.splitTaxInclusive(325000);

    expect(taxes.subtotalBase).toBe(273109.24);
    expect(taxes.tax).toBe(51890.76);
  });

  it('total cero queda en cero', () => {
    expect(service.splitTaxInclusive(0)).toEqual({ subtotalBase: 0, tax: 0, rate: 0.19 });
  });
});

describe('ConfirmService', () => {
  let service: ConfirmService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ConfirmService] });
    service = TestBed.inject(ConfirmService);
  });

  it('arranca cerrado', () => {
    expect(service.request()).toBeNull();
    expect(service.isOpen()).toBe(false);
  });

  it('accept() resuelve true', async () => {
    const promesa = service.confirm({ title: 'Eliminar venta', message: '¿Seguro?' });

    expect(service.request()?.title).toBe('Eliminar venta');
    expect(service.request()?.message).toBe('¿Seguro?');
    expect(service.isOpen()).toBe(true);

    service.accept();
    await expect(promesa).resolves.toBe(true);
    expect(service.request()).toBeNull();
    expect(service.isOpen()).toBe(false);
  });

  it('cancel() resuelve false', async () => {
    const promesa = service.confirm({ title: 't', message: 'm' });
    service.cancel();
    await expect(promesa).resolves.toBe(false);
  });

  it('aplica los valores por defecto', () => {
    service.confirm({ title: 't', message: 'm' });
    expect(service.request()).toEqual({
      title: 't',
      message: 'm',
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      tone: 'danger'
    });
  });

  it('permite sobreescribir etiquetas y tono', () => {
    service.confirm({ title: 't', message: 'm', confirmLabel: 'Restaurar', cancelLabel: 'Dejar igual', tone: 'default' });
    expect(service.request()?.confirmLabel).toBe('Restaurar');
    expect(service.request()?.tone).toBe('default');
  });

  it('si se pide otra confirmacion sin responder, la anterior se cancela', async () => {
    const primera = service.confirm({ title: 'primera', message: 'm' });
    const segunda = service.confirm({ title: 'segunda', message: 'm' });

    await expect(primera).resolves.toBe(false);
    expect(service.request()?.title).toBe('segunda');

    service.accept();
    await expect(segunda).resolves.toBe(true);
  });
});

describe('ConfirmDialogComponent', () => {
  async function montar() {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [ConfirmService]
    }).compileComponents();

    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    const service = TestBed.inject(ConfirmService);
    fixture.detectChanges();
    return { fixture, service };
  }

  it('no renderiza nada si no hay peticion', async () => {
    const { fixture } = await montar();
    expect(fixture.nativeElement.querySelector('[role="alertdialog"]')).toBeNull();
  });

  it('muestra titulo, mensaje y el fondo borroso', async () => {
    const { fixture, service } = await montar();
    service.confirm({ title: 'Eliminar producto', message: '¿Eliminar CEM-001?' });
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('[role="alertdialog"]');
    expect(dialog).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Eliminar producto');
    expect(fixture.nativeElement.textContent).toContain('¿Eliminar CEM-001?');

    // El fondo usa backdrop-filter para el desenfoque.
    const backdrop = fixture.nativeElement.querySelector('.confirm-backdrop') as HTMLElement;
    expect(getComputedStyle(backdrop).backdropFilter).toContain('blur');
  });

  it('el boton de confirmar resuelve true y el de cancelar false', async () => {
    const { fixture, service } = await montar();

    const botones = (): HTMLButtonElement[] => Array.from(fixture.nativeElement.querySelectorAll('button'));

    const confirmada = service.confirm({ title: 'a', message: 'm' });
    fixture.detectChanges();
    botones().find((b) => b.textContent?.includes('Eliminar'))!.click();
    await expect(confirmada).resolves.toBe(true);

    const cancelada = service.confirm({ title: 'a', message: 'm' });
    fixture.detectChanges();
    botones()
      .find((b) => b.textContent?.includes('Cancelar'))!
      .click();
    await expect(cancelada).resolves.toBe(false);
  });

  it('el clic en el fondo cancela y el del panel no', async () => {
    const { fixture, service } = await montar();

    const enPanel = service.confirm({ title: 'a', message: 'm' });
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[role="alertdialog"]').click();
    fixture.detectChanges();
    expect(service.request()).not.toBeNull();
    service.accept();
    await expect(enPanel).resolves.toBe(true);

    const enFondo = service.confirm({ title: 'a', message: 'm' });
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.confirm-backdrop').click();
    await expect(enFondo).resolves.toBe(false);
  });
});