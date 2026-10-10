import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ShellComponent } from './Shell.Component';
import { AdminNotificationService } from '../../Services/admin-notification.service';
import { AuthService } from '../../Services/auth.service';

describe('ShellComponent', () => {
  let component: ShellComponent;
  let fixture: ComponentFixture<ShellComponent>;
  let httpMock: HttpTestingController;
  let authService: AuthService;
  let notificationService: AdminNotificationService;

  beforeEach(async () => {
    TestBed.resetTestingModule();

    await TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    notificationService = TestBed.inject(AdminNotificationService);

    // Mock autenticación como Administrador
    vi.spyOn(authService, 'isAuthenticated').mockReturnValue(true);
    vi.spyOn(authService, 'isAdministrator').mockReturnValue(true);

    fixture = TestBed.createComponent(ShellComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    // Descartar peticiones pendientes de sondeo en background si las hubiera
    httpMock.match(() => true).forEach((req) => req.flush({}));
    httpMock.verify();
  });

  function flushInitialRequests(): void {
    fixture.detectChanges(); // Ejecuta ngOnInit

    // Responder dashboard si fue solicitado
    const dashboardMatches = httpMock.match((req) => req.url.includes('/dashboard'));
    dashboardMatches.forEach((req) => req.flush({ pendingSaleCount: 0 }));

    // Responder ventas
    const salesMatches = httpMock.match((req) => req.url.includes('/sales'));
    salesMatches.forEach((req) => req.flush({ items: [], page: 1, pageSize: 6, totalCount: 0, totalPages: 0 }));

    // Responder solicitudes de clientes
    const customerMatches = httpMock.match((req) => req.url.includes('/customer-requests'));
    customerMatches.forEach((req) => req.flush({ items: [], page: 1, pageSize: 6, totalCount: 0, totalPages: 0 }));
  }

  it('se crea correctamente e inicializa el estado cerrado de notificaciones', () => {
    flushInitialRequests();
    expect(component).toBeTruthy();
    expect((component as any).notificationsOpen()).toBe(false);
  });

  it('toggleNotifications abre y cierra el menú desplegable', () => {
    flushInitialRequests();

    const mockEvent = { stopPropagation: vi.fn() } as unknown as MouseEvent;

    (component as any).toggleNotifications(mockEvent);
    expect((component as any).notificationsOpen()).toBe(true);

    // Al abrir, se recargan las notificaciones
    const salesMatches = httpMock.match((req) => req.url.includes('/sales'));
    salesMatches.forEach((req) =>
      req.flush({
        items: [
          {
            id: 'v1',
            saleNumber: 'VTA-001',
            customerName: 'Cliente Test',
            total: 50000,
            status: 'Pending',
            saleDate: new Date().toISOString(),
            lineCount: 2
          }
        ],
        totalCount: 1
      })
    );

    const custMatches = httpMock.match((req) => req.url.includes('/customer-requests'));
    custMatches.forEach((req) => req.flush({ items: [], totalCount: 0 }));

    expect((component as any).pendingSales().length).toBe(1);

    // Cerrar al volver a llamar
    (component as any).toggleNotifications(mockEvent);
    expect((component as any).notificationsOpen()).toBe(false);
  });

  it('cierra el menú desplegable al presionar tecla Escape', () => {
    flushInitialRequests();

    (component as any).notificationsOpen.set(true);
    expect((component as any).notificationsOpen()).toBe(true);

    component.onEscape();
    expect((component as any).notificationsOpen()).toBe(false);
  });

  it('cambia entre pestañas de ventas y clientes correctamente', () => {
    flushInitialRequests();

    expect((component as any).activeTab()).toBe('sales');

    (component as any).activeTab.set('customers');
    expect((component as any).activeTab()).toBe('customers');
  });
});
