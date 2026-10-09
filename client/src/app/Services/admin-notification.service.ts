import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Subscription, catchError, filter, interval, of, switchMap } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from './auth.service';
import { DashboardService } from './dashboard.service';
import { ToastService } from './imports.service';

/**
 * Servicio centralizado de notificaciones en tiempo real para el panel administrativo.
 *
 * Supervisa las solicitudes de producto (ventas con estado Pending) y
 * alerta al administrador mediante modal cada vez que inicia sesión (si hay pendientes)
 * y cada vez que entra una nueva solicitud mientras está en la sesión, sin necesidad
 * de recargar la página.
 */
@Injectable({
  providedIn: 'root'
})
export class AdminNotificationService implements OnDestroy {
  static readonly STORAGE_KEY = 'admin_last_seen_pending_sales';
  static readonly LOGIN_ALERT_KEY = 'admin_login_alert_shown';
  static readonly CHANNEL_NAME = 'firmeza_sales_channel';
  static readonly STORAGE_EVENT_KEY = 'firmeza_new_sale_event';

  private readonly authService = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  private static readonly localEvents$ = new Subject<{ type: string; saleNumber?: string; status?: string }>();

  /** Conteo reactivo de solicitudes de compra pendientes para insignias (badges). */
  readonly pendingSaleCount = signal<number>(0);

  /** Emite cada vez que se detecta una nueva venta para que las vistas (ej. Ventas) puedan recargarse automáticamente. */
  readonly newSaleAlert$ = new Subject<void>();

  /** Emite cuando ocurre cualquier cambio en ventas o stock (creación, confirmación, entrega, cancelación, eliminación). */
  readonly stockOrSaleChanged$ = new Subject<{ type: string; saleNumber?: string; status?: string }>();

  private pollSubscription?: Subscription;
  private localEventsSub?: Subscription;
  private channel?: BroadcastChannel;
  private storageListener?: (e: StorageEvent) => void;

  constructor() {
    this.setupRealtimeListeners();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.stopPolling();
    this.localEventsSub?.unsubscribe();
    this.channel?.close();
    if (this.storageListener && typeof window !== 'undefined') {
      window.removeEventListener('storage', this.storageListener);
    }
  }

  /**
   * Comunica entre pestañas del navegador que un cliente envió una nueva solicitud.
   * Permite que el panel del administrador reaccione al instante (0 ms) sin esperar el sondeo.
   */
  static broadcastNewSale(saleNumber?: string): void {
    const payload = { type: 'NEW_SALE', saleNumber, time: Date.now() };
    AdminNotificationService.sendBroadcast(payload);
  }

  /**
   * Comunica entre pestañas y componentes que el stock o estado de una venta cambió
   * (por ejemplo al confirmar una compra, cancelarla o registrar una nueva).
   */
  static broadcastStockChanged(saleNumber?: string, status?: string): void {
    const payload = { type: 'STOCK_CHANGED', saleNumber, status, time: Date.now() };
    AdminNotificationService.sendBroadcast(payload);
  }

  private static sendBroadcast(payload: { type: string; saleNumber?: string; status?: string; time: number }): void {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel(AdminNotificationService.CHANNEL_NAME);
        channel.postMessage(payload);
        channel.close();
      }
    } catch {
      // Ignorar fallback
    }

    try {
      localStorage.setItem(
        AdminNotificationService.STORAGE_EVENT_KEY,
        JSON.stringify(payload)
      );
    } catch {
      // Ignorar fallback
    }

    AdminNotificationService.localEvents$.next(payload);
  }

  /**
   * Configura listeners de comunicación entre ventanas / pestañas.
   */
  private setupRealtimeListeners(): void {
    this.localEventsSub = AdminNotificationService.localEvents$.subscribe((event) => {
      this.handleIncomingEvent(event);
    });

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        this.channel = new BroadcastChannel(AdminNotificationService.CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          if (event.data?.type) {
            this.handleIncomingEvent(event.data);
          }
        };
      }
    } catch {
      // Ignorar fallback
    }

    if (typeof window !== 'undefined') {
      this.storageListener = (e: StorageEvent) => {
        if (e.key === AdminNotificationService.STORAGE_EVENT_KEY && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            this.handleIncomingEvent(data);
          } catch {
            this.refresh();
          }
        }
      };
      window.addEventListener('storage', this.storageListener);
    }
  }

  private handleIncomingEvent(data: { type: string; saleNumber?: string; status?: string }): void {
    if (data.type === 'NEW_SALE' || data.type === 'STOCK_CHANGED') {
      this.refresh();
      this.newSaleAlert$.next();
      this.stockOrSaleChanged$.next(data);
    }
  }

  /**
   * Inicia el sondeo continuo de solicitudes pendientes si el usuario actual es administrador.
   * Sondea cada 3 segundos para que los pedidos de otros navegadores/dispositivos
   * aparezcan de inmediato sin necesidad de recargar la página.
   */
  startPolling(): void {
    if (this.pollSubscription) {
      return;
    }

    this.pollSubscription = interval(3000)
      .pipe(
        filter(() => this.authService.isAuthenticated() && this.authService.isAdministrator()),
        switchMap(() =>
          this.dashboardService.getDashboardData().pipe(
            catchError(() => of(null))
          )
        )
      )
      .subscribe((data) => {
        if (!data) return;
        this.processPendingCount(data.pendingSaleCount);
      });
  }

  /**
   * Detiene el sondeo.
   */
  stopPolling(): void {
    this.pollSubscription?.unsubscribe();
    this.pollSubscription = undefined;
  }

  /**
   * Realiza una consulta inmediata de solicitudes pendientes.
   */
  refresh(): void {
    if (!this.authService.isAuthenticated() || !this.authService.isAdministrator()) {
      return;
    }

    this.dashboardService
      .getDashboardData()
      .pipe(catchError(() => of(null)))
      .subscribe((data) => {
        if (!data) return;
        this.processPendingCount(data.pendingSaleCount);
      });
  }

  /**
   * Debe llamarse cuando el administrador inicia sesión exitosamente.
   * Limpia las banderas previas para asegurar que el modal de inicio de sesión se muestre.
   */
  onAdminLogin(): void {
    sessionStorage.removeItem(AdminNotificationService.LOGIN_ALERT_KEY);
    sessionStorage.removeItem(AdminNotificationService.STORAGE_KEY);
    this.refresh();
  }

  /**
   * Marca el conteo actual como visto (por ejemplo al ingresar a la vista de ventas).
   */
  markSeen(): void {
    const current = this.pendingSaleCount();
    sessionStorage.setItem(AdminNotificationService.STORAGE_KEY, String(current));
  }

  /**
   * Reinicia los datos de notificación al cerrar sesión.
   */
  reset(): void {
    this.stopPolling();
    this.pendingSaleCount.set(0);
    sessionStorage.removeItem(AdminNotificationService.STORAGE_KEY);
    sessionStorage.removeItem(AdminNotificationService.LOGIN_ALERT_KEY);
  }

  /**
   * Evalúa el conteo devuelto por la API y dispara el modal si hay solicitudes pendientes.
   */
  private processPendingCount(count: number): void {
    this.pendingSaleCount.set(count);

    const loginAlertShown = sessionStorage.getItem(AdminNotificationService.LOGIN_ALERT_KEY) === 'true';
    const storedRaw = sessionStorage.getItem(AdminNotificationService.STORAGE_KEY);
    const lastSeenCount = storedRaw !== null ? parseInt(storedRaw, 10) : null;

    // CASO 1: Al iniciar sesión como administrador (o primera carga de la sesión).
    // Si hay solicitudes pendientes y aún no se ha mostrado el modal de inicio de sesión:
    if (!loginAlertShown) {
      sessionStorage.setItem(AdminNotificationService.LOGIN_ALERT_KEY, 'true');
      sessionStorage.setItem(AdminNotificationService.STORAGE_KEY, String(count));

      if (count > 0) {
        this.notify(count, count, true);
      }
      return;
    }

    // CASO 2: Mientras está en la sesión.
    // Si el conteo aumenta respecto al último conteo guardado (un cliente envió una nueva solicitud):
    if (lastSeenCount !== null && count > lastSeenCount) {
      const added = count - lastSeenCount;
      sessionStorage.setItem(AdminNotificationService.STORAGE_KEY, String(count));
      this.notify(count, added, false);
      this.newSaleAlert$.next();
      return;
    }

    // Si el conteo disminuyó (ej. admin aprobó/canceló solicitudes), actualizamos la referencia:
    if (lastSeenCount === null || count < lastSeenCount) {
      sessionStorage.setItem(AdminNotificationService.STORAGE_KEY, String(count));
    }
  }

  /**
   * Dispara el modal SweetAlert al administrador informando de la solicitud.
   */
  private notify(totalPending: number, addedCount: number, isLogin: boolean): void {
    // Si el administrador está redactando una nota en un modal activo (textarea decision-note),
    // mostramos un toast flotante para no destruir el texto que está escribiendo.
    if (typeof document !== 'undefined' && document.getElementById('decision-note')) {
      const toastText = addedCount === 1
        ? '¡Nueva solicitud de producto recibida!'
        : `¡${addedCount} nuevas solicitudes de producto recibidas!`;
      this.toastService.info(toastText);
      return;
    }

    const title = isLogin
      ? (totalPending === 1 ? 'Tienes 1 solicitud de producto pendiente' : `Tienes ${totalPending} solicitudes de producto pendientes`)
      : (addedCount === 1 ? '¡Nueva solicitud de producto recibida!' : `¡${addedCount} nuevas solicitudes de producto recibidas!`);

    const text = isLogin
      ? (totalPending === 1
          ? 'Hay 1 solicitud de producto esperando tu revisión.'
          : `Hay ${totalPending} solicitudes de producto esperando tu revisión.`)
      : (totalPending === 1
          ? 'Un cliente acaba de enviar una solicitud de producto.'
          : `Hay ${totalPending} solicitudes de producto pendientes esperando tu respuesta.`);

    void Swal.fire({
      title,
      text,
      icon: 'info',
      confirmButtonText: 'Revisar ventas',
      cancelButtonText: 'Ahora no',
      showCancelButton: true,
      confirmButtonColor: '#0284c7',
      cancelButtonColor: '#64748b',
      width: '440px'
    }).then((result) => {
      if (result.isConfirmed) {
        void this.router.navigate(['/ventas'], { queryParams: { status: 'Pending' } });
      }
    });
  }
}
