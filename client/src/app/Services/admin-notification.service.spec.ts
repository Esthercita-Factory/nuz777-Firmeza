import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { AdminNotificationService } from './admin-notification.service';
import { AuthService } from './auth.service';
import { DashboardData, DashboardService } from './dashboard.service';
import { ToastService } from './imports.service';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('AdminNotificationService', () => {
  let service: AdminNotificationService;
  let mockAuthService: { isAuthenticated: ReturnType<typeof vi.fn>; isAdministrator: ReturnType<typeof vi.fn> };
  let mockDashboardService: { getDashboardData: ReturnType<typeof vi.fn> };
  let mockToastService: { info: ReturnType<typeof vi.fn> };
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

  const fakeDashboardData = (pendingSaleCount: number): DashboardData => ({
    activeProductCount: 10,
    activeCustomerCount: 5,
    saleCount: 20,
    salesTotal: 500000,
    recentSales: [],
    pendingSaleCount
  });

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.spyOn(Swal, 'fire').mockResolvedValue({ isConfirmed: false, isDenied: false, isDismissed: true });

    mockAuthService = {
      isAuthenticated: vi.fn().mockReturnValue(true),
      isAdministrator: vi.fn().mockReturnValue(true)
    };

    mockDashboardService = {
      getDashboardData: vi.fn().mockReturnValue(of(fakeDashboardData(0)))
    };

    mockToastService = {
      info: vi.fn()
    };

    mockRouter = {
      navigate: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        AdminNotificationService,
        { provide: AuthService, useValue: mockAuthService },
        { provide: DashboardService, useValue: mockDashboardService },
        { provide: ToastService, useValue: mockToastService },
        { provide: Router, useValue: mockRouter }
      ]
    });
  });

  afterEach(() => {
    service?.ngOnDestroy();
    sessionStorage.clear();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('no notifica si no hay solicitudes pendientes (count = 0)', () => {
    mockDashboardService.getDashboardData.mockReturnValue(of(fakeDashboardData(0)));
    service = TestBed.inject(AdminNotificationService);
    service.refresh();

    expect(service.pendingSaleCount()).toBe(0);
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  it('notifica al iniciar sesión si hay solicitudes pendientes', () => {
    mockDashboardService.getDashboardData.mockReturnValue(of(fakeDashboardData(2)));
    service = TestBed.inject(AdminNotificationService);
    service.refresh();

    expect(service.pendingSaleCount()).toBe(2);
    expect(Swal.fire).toHaveBeenCalledTimes(1);
  });

  it('notifica en tiempo real cuando un cliente crea una nueva solicitud durante la sesión', () => {
    mockDashboardService.getDashboardData.mockReturnValue(of(fakeDashboardData(1)));
    service = TestBed.inject(AdminNotificationService);
    service.refresh();

    expect(Swal.fire).toHaveBeenCalledTimes(1);

    // Llega una nueva solicitud mientras el admin está en la sesión (sin recargar la página)
    mockDashboardService.getDashboardData.mockReturnValue(of(fakeDashboardData(2)));
    service.refresh();

    expect(service.pendingSaleCount()).toBe(2);
    expect(Swal.fire).toHaveBeenCalledTimes(2);
  });

  it('no vuelve a notificar si el conteo disminuye o se mantiene', () => {
    mockDashboardService.getDashboardData.mockReturnValue(of(fakeDashboardData(2)));
    service = TestBed.inject(AdminNotificationService);
    service.refresh();

    expect(Swal.fire).toHaveBeenCalledTimes(1);

    // El admin atiende una solicitud: baja a 1
    mockDashboardService.getDashboardData.mockReturnValue(of(fakeDashboardData(1)));
    service.refresh();

    expect(service.pendingSaleCount()).toBe(1);
    expect(Swal.fire).toHaveBeenCalledTimes(1);
  });

  it('onAdminLogin() limpia marcas y asegura que la notificación se muestre en el nuevo ingreso', () => {
    mockDashboardService.getDashboardData.mockReturnValue(of(fakeDashboardData(2)));
    service = TestBed.inject(AdminNotificationService);
    service.refresh();

    expect(Swal.fire).toHaveBeenCalledTimes(1);

    // Cierra sesión y vuelve a ingresar
    service.onAdminLogin();

    expect(Swal.fire).toHaveBeenCalledTimes(2);
  });

  it('broadcastNewSale() emite evento por storage que activa el refresh del servicio', () => {
    service = TestBed.inject(AdminNotificationService);
    const refreshSpy = vi.spyOn(service, 'refresh');

    AdminNotificationService.broadcastNewSale('V-2026-001');

    window.dispatchEvent(new StorageEvent('storage', {
      key: AdminNotificationService.STORAGE_EVENT_KEY,
      newValue: JSON.stringify({ saleNumber: 'V-2026-001' })
    }));

    expect(refreshSpy).toHaveBeenCalled();
  });

  it('reset() limpia el estado y las claves de almacenamiento de sesión', () => {
    mockDashboardService.getDashboardData.mockReturnValue(of(fakeDashboardData(3)));
    service = TestBed.inject(AdminNotificationService);
    service.refresh();

    expect(service.pendingSaleCount()).toBe(3);

    service.reset();

    expect(service.pendingSaleCount()).toBe(0);
    expect(sessionStorage.getItem(AdminNotificationService.STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem(AdminNotificationService.LOGIN_ALERT_KEY)).toBeNull();
  });
});
