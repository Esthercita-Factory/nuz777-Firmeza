import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RegisterComponent } from './Register.Component';

describe('RegisterComponent - Límite de tiempo de 1 minuto en borrador', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;

  const DRAFT_KEY = 'firmeza-draft-register';

  beforeEach(async () => {
    localStorage.removeItem(DRAFT_KEY);
    vi.useFakeTimers();

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    localStorage.removeItem(DRAFT_KEY);
    component.ngOnDestroy();
    vi.useRealTimers();
  });

  it('guarda los datos con timestamp en localStorage al llamar saveDraft()', async () => {
    (component as any).fullName = 'Carlos Rodriguez';
    (component as any).document = '1098765432';
    (component as any).email = 'carlos@ejemplo.com';

    (component as any).saveDraft();
    await Promise.resolve(); // Microtasks

    const raw = localStorage.getItem(DRAFT_KEY);
    expect(raw).toBeTruthy();
    const data = JSON.parse(raw!);
    expect(data.fullName).toBe('Carlos Rodriguez');
    expect(data.document).toBe('1098765432');
    expect(typeof data.savedAt).toBe('number');
  });

  it('borra automáticamente los inputs tras 1 minuto (60.000 ms) de inactividad', async () => {
    (component as any).fullName = 'Maria Lopez';
    (component as any).document = '52123456';
    (component as any).email = 'maria@ejemplo.com';

    (component as any).saveDraft();
    await Promise.resolve();

    expect((component as any).fullName).toBe('Maria Lopez');

    // Avanzamos 59 segundos: aún no se borra
    vi.advanceTimersByTime(59_000);
    expect((component as any).fullName).toBe('Maria Lopez');

    // Avanzamos 1 segundo más (total 60 segundos = 1 minuto)
    vi.advanceTimersByTime(1_000);

    // Los campos deben haberse limpiado
    expect((component as any).fullName).toBe('');
    expect((component as any).document).toBe('');
    expect((component as any).email).toBe('');
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it('no restaura el borrador si tiene más de 1 minuto de antigüedad al cargar la página', () => {
    const expiredDraft = {
      fullName: 'Juan Antiguo',
      document: '12345',
      email: 'antiguo@correo.com',
      savedAt: Date.now() - 65_000 // 65 segundos atrás
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(expiredDraft));

    (component as any).restoreDraft();

    expect((component as any).fullName).toBe('');
    expect((component as any).document).toBe('');
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it('restaura el borrador si fue guardado hace menos de 1 minuto y programa el tiempo restante', () => {
    const recentDraft = {
      fullName: 'Ana Reciente',
      document: '998877',
      email: 'ana@correo.com',
      savedAt: Date.now() - 30_000 // Guardado hace 30 segundos
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(recentDraft));

    (component as any).restoreDraft();

    expect((component as any).fullName).toBe('Ana Reciente');
    expect((component as any).document).toBe('998877');

    // Al avanzar 30 segundos más (completando los 60s), se limpia
    vi.advanceTimersByTime(31_000);
    expect((component as any).fullName).toBe('');
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it('incrementa y decrementa la edad con control de límites (18 a 120)', () => {
    (component as any).age = 18;

    // No debe decrementar por debajo de 18
    (component as any).decrementAge();
    expect((component as any).age).toBe(18);

    // Incrementa adecuadamente
    (component as any).incrementAge();
    expect((component as any).age).toBe(19);

    (component as any).incrementAge();
    expect((component as any).age).toBe(20);

    // Decrementa adecuadamente
    (component as any).decrementAge();
    expect((component as any).age).toBe(19);

    // Límite superior: 120
    (component as any).age = 120;
    (component as any).incrementAge();
    expect((component as any).age).toBe(120);

    (component as any).decrementAge();
    expect((component as any).age).toBe(119);
  });
});
