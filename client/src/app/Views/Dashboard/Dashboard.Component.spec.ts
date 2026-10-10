import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { DashboardComponent } from './Dashboard.Component';
import { DashboardData, DashboardService } from '../../Services/dashboard.service';
import { AuthService } from '../../Services/auth.service';

describe('DashboardComponent - Gráfico de dona animado', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let dashboardService: DashboardService;

  const mockDashboardData: DashboardData = {
    activeProductCount: 15,
    activeCustomerCount: 8,
    saleCount: 10,
    salesTotal: 15000000,
    pendingSaleCount: 3,
    recentSales: [],
    trend: [
      { date: '2026-10-01', label: '01/10', total: 2000000, count: 2 },
      { date: '2026-10-02', label: '02/10', total: 5000000, count: 4 }
    ],
    statusDistribution: [
      { status: 'Pending', count: 3, total: 3000000 },
      { status: 'Confirmed', count: 4, total: 7000000 },
      { status: 'Delivered', count: 2, total: 4000000 },
      { status: 'Cancelled', count: 1, total: 1000000 }
    ]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: DashboardService,
          useValue: {
            getDashboardData: () => of(mockDashboardData)
          }
        },
        {
          provide: AuthService,
          useValue: {
            getUser: () => ({ fullName: 'Admin Firmeza' })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    dashboardService = TestBed.inject(DashboardService);
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('inicializa el dashboard y carga datos', () => {
    expect((component as any).data()).toEqual(mockDashboardData);
    expect((component as any).chartView()).toBe('trend');
  });

  it('cambia la vista a dona y activa la animación con setChartView("donut")', () => {
    const triggerSpy = vi.spyOn(component as any, 'triggerDonutAnimation');
    (component as any).setChartView('donut');

    expect((component as any).chartView()).toBe('donut');
    expect(triggerSpy).toHaveBeenCalled();
  });

  it('alterna entre tendencia y dona con toggleChartView()', () => {
    expect((component as any).chartView()).toBe('trend');
    (component as any).toggleChartView();
    expect((component as any).chartView()).toBe('donut');
    (component as any).toggleChartView();
    expect((component as any).chartView()).toBe('trend');
  });

  it('calcula correctamente donutData con los 4 estados y estilos de tarjeta activa', () => {
    const donut = (component as any).donutData();
    expect(donut).toBeTruthy();
    expect(donut.totalCount).toBe(10);
    expect(donut.totalAmount).toBe(15000000);
    expect(donut.slices.length).toBe(4);

    const pendingSlice = donut.slices.find((s: any) => s.status === 'Pending');
    expect(pendingSlice).toBeTruthy();
    expect(pendingSlice.label).toBe('Pendientes');
    expect(pendingSlice.percentage).toBe(30);
    expect(pendingSlice.cardActiveClass).toContain('border-amber-400');
    expect(pendingSlice.glow).toContain('245, 158, 11');

    const confirmedSlice = donut.slices.find((s: any) => s.status === 'Confirmed');
    expect(confirmedSlice.percentage).toBe(40);
    expect(confirmedSlice.cardActiveClass).toContain('border-sky-400');
  });

  it('escala las rebanadas y el contador animado en función de donutAnimationProgress', () => {
    (component as any).donutAnimationProgress.set(0);
    let donut = (component as any).donutData();
    let pendingSlice = donut.slices.find((s: any) => s.status === 'Pending');
    expect(pendingSlice.dashArray.startsWith('0 ')).toBe(true);
    expect((component as any).animatedTotalCount()).toBe(0);

    (component as any).donutAnimationProgress.set(1);
    donut = (component as any).donutData();
    pendingSlice = donut.slices.find((s: any) => s.status === 'Pending');
    expect(pendingSlice.dashArray.startsWith('0 ')).toBe(false);
    expect((component as any).animatedTotalCount()).toBe(10);
  });

  it('actualiza el estado de hover y activeDonutSlice al pasar el cursor', () => {
    expect((component as any).hoveredDonutStatus()).toBeNull();
    expect((component as any).activeDonutSlice()).toBeNull();

    (component as any).hoveredDonutStatus.set('Delivered');
    expect((component as any).activeDonutSlice()?.label).toBe('Entregadas');
    expect((component as any).activeDonutSlice()?.count).toBe(2);

    (component as any).hoveredDonutStatus.set(null);
    expect((component as any).activeDonutSlice()).toBeNull();
  });

  it('cancela los frames de animación al destruir el componente', () => {
    (component as any).donutAnimFrameId = 999;
    (component as any).trendAnimFrameId = 888;
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
    component.ngOnDestroy();
    expect(cancelSpy).toHaveBeenCalledWith(999);
    expect(cancelSpy).toHaveBeenCalledWith(888);
    expect((component as any).donutAnimFrameId).toBeNull();
    expect((component as any).trendAnimFrameId).toBeNull();
  });

  it('activa la animación de la línea azul con setChartView("trend") y triggerTrendAnimation()', () => {
    const trendSpy = vi.spyOn(component as any, 'triggerTrendAnimation');
    (component as any).setChartView('trend');
    expect(trendSpy).toHaveBeenCalled();

    (component as any).trendAnimationProgress.set(0);
    expect((component as any).trendAnimationProgress()).toBe(0);
    (component as any).trendAnimationProgress.set(1);
    expect((component as any).trendAnimationProgress()).toBe(1);
  });
});
