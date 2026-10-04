import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../Services/auth.service';
import { LogoComponent } from '../Layout/Shell.Component';

@Component({
  selector: 'app-home',
  imports: [RouterLink, LogoComponent],
  template: `
    <header class="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-lg">
      <div class="mx-auto flex h-16 max-w-7xl items-center gap-3 px-5 lg:px-8">
        <a routerLink="/" class="flex items-center gap-2">
          <app-logo size="sm" />
          <span class="text-xl font-black tracking-tight text-slate-950">Firmeza<span class="text-blue-500">.</span></span>
        </a>
        <div class="ml-auto flex items-center gap-3">
          <a routerLink="/login" class="inline-flex items-center gap-1.5 text-sm font-bold text-slate-700 transition hover:text-blue-600">
            <svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" class="h-4 w-4">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            Ingresar
          </a>
          <a
            routerLink="/register"
            class="inline-flex items-center gap-1.5 rounded-xl bg-blue-500 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-600"
          >
            <svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" class="h-4 w-4">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M19 8v6m3-3h-6" />
            </svg>
            Crear cuenta
          </a>
        </div>
      </div>
    </header>

    <section class="relative overflow-hidden border-b border-slate-200">
      <!-- Fondo: skyline de edificios -->
      <svg
        class="pointer-events-none absolute inset-x-0 bottom-0 h-72 w-full select-none"
        viewBox="0 0 1200 300"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
      >
        <defs>
          <pattern id="ventanas" width="14" height="18" patternUnits="userSpaceOnUse">
            <rect x="3" y="4" width="6" height="8" fill="#ffffff" opacity=".75" />
          </pattern>
          <g id="edificiosFondo">
            <rect x="0" y="140" width="90" height="160" />
            <rect x="90" y="100" width="70" height="200" />
            <rect x="160" y="170" width="100" height="130" />
            <rect x="260" y="80" width="80" height="220" />
            <rect x="340" y="150" width="110" height="150" />
            <rect x="450" y="110" width="70" height="190" />
            <rect x="520" y="60" width="90" height="240" />
            <rect x="610" y="140" width="100" height="160" />
            <rect x="710" y="90" width="80" height="210" />
            <rect x="790" y="160" width="110" height="140" />
            <rect x="900" y="70" width="80" height="230" />
            <rect x="980" y="130" width="100" height="170" />
            <rect x="1080" y="100" width="120" height="200" />
          </g>
          <clipPath id="recorteFondo"><use href="#edificiosFondo" /></clipPath>
        </defs>

        <use href="#edificiosFondo" fill="#cbd5e1" opacity=".55" />
        <rect width="1200" height="300" fill="url(#ventanas)" clip-path="url(#recorteFondo)" opacity=".6" />
        <g fill="#bfdbfe" opacity=".7">
          <rect x="40" y="200" width="100" height="100" />
          <rect x="140" y="170" width="70" height="130" />
          <rect x="230" y="210" width="120" height="90" />
          <rect x="380" y="180" width="80" height="120" />
          <rect x="490" y="220" width="110" height="80" />
          <rect x="640" y="190" width="90" height="110" />
          <rect x="760" y="215" width="120" height="85" />
          <rect x="910" y="185" width="80" height="115" />
          <rect x="1020" y="210" width="110" height="90" />
        </g>
      </svg>

      <div class="relative z-10 mx-auto grid max-w-7xl gap-10 px-5 pb-10 pt-4 lg:grid-cols-[1fr_1fr] lg:items-center lg:px-8">
        <!-- Texto -->
        <div>
          <span class="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
            <span class="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
            Plataforma de gestión empresarial
          </span>
          <h1 class="mt-6 text-4xl font-bold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl">
            Control integral de inventario, clientes y ventas
            <span class="text-blue-600">en una sola plataforma</span>
          </h1>
          <p class="mt-5 max-w-xl text-base leading-7 text-slate-600">
            Firmeza centraliza el catálogo de materiales, la cartera de clientes y el registro de operaciones con trazabilidad completa,
            para que su equipo decida sobre información verificada y trazable.
          </p>
          <div class="mt-8 flex flex-wrap gap-3">
            <a routerLink="/login" class="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
              Acceder al panel
            </a>
            <a routerLink="/register" class="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-700">
              Registrar cuenta de cliente
            </a>
          </div>
          <dl class="mt-10 grid grid-cols-1 gap-x-8 gap-y-4 border-t border-slate-200 pt-6 sm:grid-cols-3">
            @for (item of highlights; track item.label) {
              <div>
                <dt class="text-xs font-semibold uppercase tracking-wider text-slate-500">{{ item.label }}</dt>
                <dd class="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                  <svg fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" class="h-4 w-4" [class]="item.iconClass">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {{ item.value }}
                </dd>
              </div>
            }
          </dl>
        </div>

        <!-- Ilustración: grande y siempre a la derecha -->
        <div class="animate-slide-in-left flex justify-center lg:justify-end">
          <img
            src="img/Blackman.png"
            alt="Ilustración de Blackman"
            class="block h-auto w-full max-w-[520px] scale-110 object-contain mix-blend-multiply lg:max-w-none lg:w-[145%] lg:max-h-[80vh] lg:translate-x-[8%]"
          />
        </div>
      </div>

      <!-- Panel de operaciones centrado -->
      <div class="relative z-10 mx-auto max-w-3xl px-5 pb-16 lg:px-0">
        <div class="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
            <div class="flex items-center gap-2.5">
              <span class="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500 text-white">
                <svg viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
                  <path d="M13.35 1.5h-.92L4.35 14h4.46l-4 8.5h.85L14.69 16H8.9l5.6-14.5Z" />
                </svg>
              </span>
              <div>
                <p class="text-sm font-semibold leading-tight text-slate-900">Panel de operaciones</p>
                <p class="text-xs leading-tight text-slate-500">Actualizado hace 2 min</p>
              </div>
            </div>
            <span class="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              Operativo
            </span>
          </div>

          <div class="px-5 py-4">
            <div class="grid grid-cols-[0.8fr_2fr_0.7fr_0.9fr] gap-3 border-b border-slate-200 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <span>Código</span>
              <span>Descripción</span>
              <span class="text-right">Stock</span>
              <span class="text-right">Precio</span>
            </div>
            @for (row of sampleRows; track row.sku) {
              <div class="grid grid-cols-[0.8fr_2fr_0.7fr_0.9fr] gap-3 border-b border-slate-100 py-3 text-sm text-slate-700">
                <span class="font-medium text-slate-900">{{ row.sku }}</span>
                <span>{{ row.name }}</span>
                <span class="text-right tabular-nums" [class]="row.lowStock ? 'text-blue-600' : ''">{{ row.stock }}</span>
                <span class="text-right tabular-nums">{{ row.price }}</span>
              </div>
            }
          </div>

          <div class="flex items-center justify-between px-5 py-3 text-xs text-slate-600">
            <span>4 registros · sincronización activa</span>
            <span class="font-semibold text-slate-900">Valor total $ 52.480.000</span>
          </div>
        </div>
      </div>
    </section>

    <section class="border-b border-slate-200 bg-white">
      <div class="grid grid-cols-2 divide-x divide-slate-200 lg:grid-cols-4">
        @for (stat of stats; track stat.label) {
          <div class="px-2 py-8 text-center">
            <p class="text-3xl font-bold tabular-nums text-slate-900">{{ stat.value }}</p>
            <p class="mt-1 text-sm text-slate-600">{{ stat.label }}</p>
          </div>
        }
      </div>
    </section>

    <section class="py-16">
      <div class="mx-auto max-w-7xl px-5 lg:px-8">
        <div class="max-w-2xl">
          <p class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            <svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" class="h-4 w-4">
              <path d="M12 2 2 7l10 5 10-5-10-5Z" />
              <path d="m2 17 10 5 10-5" />
              <path d="m2 12 10 5 10-5" />
            </svg>
            Módulos del sistema
          </p>
          <h2 class="mt-3 text-3xl font-bold tracking-tight text-slate-900">Una operación estructurada, de punta a punta</h2>
          <p class="mt-4 text-base leading-7 text-slate-600">
            Cada módulo comparte la misma base de datos y las mismas reglas de validación, lo que elimina la duplicación de información entre áreas.
          </p>
          <div class="mt-6 flex flex-wrap gap-2">
            @for (chip of highlights; track chip.label) {
              <span class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 shadow-sm">
                <svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" class="h-4 w-4" [class]="chip.iconClass">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {{ chip.label }}
              </span>
            }
          </div>
        </div>

        <div class="mt-10 grid gap-5 sm:grid-cols-2">
          @for (module of modules; track module.title) {
            <article class="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-slate-300 hover:shadow-md">
              <div class="flex items-center gap-3">
                <span class="flex h-10 w-10 items-center justify-center rounded-lg" [class]="module.iconClass">
                  <svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" class="h-5 w-5">
                    <path [attr.d]="module.icon" />
                  </svg>
                </span>
                <h3 class="text-base font-semibold text-slate-900">{{ module.title }}</h3>
              </div>
              <p class="mt-4 text-sm leading-6 text-slate-600">{{ module.description }}</p>
            </article>
          }
        </div>
      </div>
    </section>

    <section class="bg-slate-900 px-8 py-12 text-center">
      <h2 class="text-2xl font-bold tracking-tight text-white">Comience a operar con Firmeza</h2>
      <p class="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-300">
        El acceso al panel administrativo se realiza con credenciales asignadas por el administrador del sistema. Los clientes acceden desde su portal con registro propio.
      </p>
      <div class="mt-7 flex flex-wrap justify-center gap-3">
        <a routerLink="/login" class="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-600">
          Iniciar sesión
        </a>
        <a routerLink="/register" class="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-blue-500 hover:text-blue-400">
          Crear cuenta de cliente
        </a>
      </div>
    </section>

    <footer class="border-t border-slate-200 bg-white px-5 py-6 text-center text-xs text-slate-500 lg:px-8">
      Firmeza · Gestión de productos y clientes
    </footer>
  `
})
export class HomeComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly highlights = [
    { label: 'Disponibilidad', value: '99,9 % uptime', iconClass: 'text-emerald-600' },
    { label: 'Soporte', value: 'Soporte especializado', iconClass: 'text-blue-600' },
    { label: 'Seguridad', value: 'Cifrado TLS 1.3', iconClass: 'text-sky-600' }
  ];

  protected readonly sampleRows = [
    { sku: 'MAT-1042', name: 'Cemento Portland 50 kg', stock: 320, price: '$ 18.400', lowStock: false },
    { sku: 'MAT-2087', name: 'Acero corrugado 12 mm', stock: 145, price: '$ 96.500', lowStock: false },
    { sku: 'MAT-3315', name: 'Ladrillo cerámico hueco', stock: 28, price: '$ 3.250', lowStock: true },
    { sku: 'MAT-4402', name: 'Adhesivo cerámico 25 kg', stock: 96, price: '$ 27.900', lowStock: false }
  ];

  protected readonly stats = [
    { value: '1.240', label: 'Productos en catálogo' },
    { value: '318', label: 'Clientes registrados' },
    { value: '2.907', label: 'Operaciones procesadas' },
    { value: '0', label: 'Incidentes de seguridad' }
  ];

  protected readonly modules = [
    {
      title: 'Catálogo de materiales',
      description:
        'Codificación única por producto, control de existencias, precios con vigencia y alertas de stock mínimo para evitar quiebres de suministro.',
      iconClass: 'bg-blue-50 text-blue-600',
      icon:
        'M7.5 4.27l9 5.15M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z'
    },
    {
      title: 'Gestión de clientes',
      description:
        'Ficha única por cliente con historial de operaciones, estado de cuenta y documentación asociada, disponible desde cualquier punto de la organización.',
      iconClass: 'bg-sky-50 text-sky-600',
      icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75'
    },
    {
      title: 'Registro de ventas',
      description:
        'Emisión y seguimiento de operaciones con estados definidos, totales consistentes y emisión de comprobantes en PDF para respaldo contable.',
      iconClass: 'bg-emerald-50 text-emerald-600',
      icon: 'M2 5h20v14H2zM2 10h20'
    },
    {
      title: 'Carga masiva',
      description:
        'Importación de catálogos y listas mediante plantilla validada, con reporte de errores por fila para corregir sin duplicar carga manual.',
      iconClass: 'bg-slate-100 text-slate-600',
      icon: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12'
    }
  ];

  ngOnInit(): void {
    if (this.authService.isAuthenticated() && this.authService.isAdministrator()) {
      this.router.navigate(['/dashboard']);
    }
  }
}
