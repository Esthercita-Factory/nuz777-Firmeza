import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toApiError } from '../../Services/Api.Service';
import { AuthService } from '../../Services/auth.service';
import { DashboardData, DashboardService } from '../../Services/dashboard.service';
import { SaleStatus, SalesService } from '../../Services/sales.service';
import { IconComponent } from '../Shared/Icon.Component';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, CurrencyPipe, DatePipe, DecimalPipe, IconComponent],
  template: `
    @if (errorMessage(); as message) {
      <div class="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-800">{{ message }}</div>
    }

    <!-- Header contextual -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-blue-700 ring-1 ring-blue-200">
            <span class="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
            Panel de control
          </span>
          <span class="text-xs font-semibold text-slate-400 capitalize">· {{ todayFormatted }}</span>
        </div>
        <h1 class="mt-2 text-3xl font-black tracking-tight text-slate-950">
          {{ greeting() }}, {{ authService.getUser()?.fullName }}
        </h1>
        <p class="mt-1 text-sm text-slate-500">Monitorea en tiempo real las operaciones comerciales y el inventario de Ferretería Firmeza.</p>
      </div>

      <div class="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          (click)="reload()"
          class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:scale-95"
          title="Actualizar métricas"
        >
          <svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" class="h-3.5 w-3.5 text-slate-500" [class.animate-spin]="loading()">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.83 6.72 2.24L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
          Actualizar
        </button>
        <a
          routerLink="/ventas/nueva"
          class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-black text-white shadow-md shadow-blue-200 transition hover:bg-blue-500 active:scale-95"
        >
          <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" class="h-3.5 w-3.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nueva venta
        </a>
      </div>
    </div>

    @if (loading() && !data()) {
      <div class="mt-12 flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-24 shadow-sm">
        <svg viewBox="0 0 24 24" fill="none" class="h-8 w-8 animate-spin text-blue-600">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-25" />
          <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
        </svg>
        <span class="ml-3 text-sm font-semibold text-slate-500">Cargando métricas del negocio…</span>
      </div>
    }

    @if (data(); as dashboard) {
      <!-- Banner de alerta destacada para solicitudes pendientes -->
      @if (dashboard.pendingSaleCount > 0) {
        <div class="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-amber-100/50 to-orange-50 p-5 shadow-sm">
          <div class="flex items-center gap-3.5">
            <div class="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-200">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span class="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                <span class="relative inline-flex h-3.5 w-3.5 rounded-full bg-rose-500"></span>
              </span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-sm font-black text-amber-950">
                  {{ dashboard.pendingSaleCount === 1 ? 'Tienes 1 solicitud de producto pendiente' : 'Tienes ' + dashboard.pendingSaleCount + ' solicitudes de producto pendientes' }}
                </h3>
                <span class="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-900">
                  Atención requerida
                </span>
              </div>
              <p class="mt-0.5 text-xs text-amber-800/80">
                Hay clientes que enviaron compras desde el portal y están esperando tu aprobación para el despacho.
              </p>
            </div>
          </div>
          <a
            routerLink="/ventas"
            [queryParams]="{ status: 'Pending' }"
            class="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-slate-800 active:scale-95"
          >
            Revisar solicitudes ahora <span aria-hidden="true">→</span>
          </a>
        </div>
      }

      <!-- Tarjetas KPI principales -->
      <div class="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        <!-- Tarjeta 1: Ventas acumuladas -->
        <div class="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-xl shadow-slate-950/10 ring-1 ring-white/10">
          <div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-blue-300">Total acumulado</span>
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 ring-1 ring-blue-400/30">
                <svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" class="h-5 w-5">
                  <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
            </div>
            <p class="mt-4 break-words text-2xl font-black tracking-tight tabular-nums">{{ dashboard.salesTotal | currency: 'COP' }}</p>
          </div>
          <div class="mt-5 border-t border-white/10 pt-3 flex items-center justify-between text-xs text-slate-400">
            <span>Ticket promedio:</span>
            <span class="font-bold text-slate-200 tabular-nums">{{ averageTicket() | currency: 'COP' }}</span>
          </div>
        </div>

        <!-- Tarjeta 2: Solicitudes pendientes -->
        <div class="flex flex-col justify-between rounded-2xl border-t-4 border-t-amber-500 bg-white p-6 shadow-sm ring-1 ring-slate-100 transition hover:shadow-md">
          <div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Solicitudes pendientes</span>
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" class="h-5 w-5">
                  <path d="M6 2 3 6h14l-3-4H6Z" />
                  <path d="M3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6" />
                  <path d="M3 10h18" />
                </svg>
              </div>
            </div>
            <div class="mt-4 flex items-baseline gap-2">
              <p class="text-3xl font-black tabular-nums" [class]="dashboard.pendingSaleCount > 0 ? 'text-amber-600' : 'text-slate-950'">
                {{ dashboard.pendingSaleCount | number }}
              </p>
              @if (dashboard.pendingSaleCount > 0) {
                <span class="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase text-amber-800">Por validar</span>
              }
            </div>
          </div>
          <div class="mt-5 border-t border-slate-100 pt-3">
            <a routerLink="/ventas" [queryParams]="{ status: 'Pending' }" class="inline-flex items-center gap-1 text-xs font-bold text-amber-600 transition hover:gap-2">
              Revisar solicitudes <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        <!-- Tarjeta 3: Ventas registradas -->
        <div class="flex flex-col justify-between rounded-2xl border-t-4 border-t-emerald-500 bg-white p-6 shadow-sm ring-1 ring-slate-100 transition hover:shadow-md">
          <div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Ventas registradas</span>
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" class="h-5 w-5">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <path d="M2 10h20" />
                  <path d="m6 15 4-4 3 2 5-5" />
                </svg>
              </div>
            </div>
            <p class="mt-4 text-3xl font-black tabular-nums text-slate-950">{{ dashboard.saleCount | number }}</p>
          </div>
          <div class="mt-5 border-t border-slate-100 pt-3">
            <a routerLink="/ventas" class="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 transition hover:gap-2">
              Ver listado de ventas <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        <!-- Tarjeta 4: Productos activos -->
        <div class="flex flex-col justify-between rounded-2xl border-t-4 border-t-blue-500 bg-white p-6 shadow-sm ring-1 ring-slate-100 transition hover:shadow-md">
          <div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Productos activos</span>
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" class="h-5 w-5">
                  <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                  <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
                </svg>
              </div>
            </div>
            <p class="mt-4 text-3xl font-black tabular-nums text-slate-950">{{ dashboard.activeProductCount | number }}</p>
          </div>
          <div class="mt-5 border-t border-slate-100 pt-3">
            <a routerLink="/productos" class="inline-flex items-center gap-1 text-xs font-bold text-blue-600 transition hover:gap-2">
              Explorar catálogo <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        <!-- Tarjeta 5: Clientes activos -->
        <div class="flex flex-col justify-between rounded-2xl border-t-4 border-t-indigo-500 bg-white p-6 shadow-sm ring-1 ring-slate-100 transition hover:shadow-md">
          <div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Clientes registrados</span>
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" class="h-5 w-5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
            </div>
            <p class="mt-4 text-3xl font-black tabular-nums text-slate-950">{{ dashboard.activeCustomerCount | number }}</p>
          </div>
          <div class="mt-5 border-t border-slate-100 pt-3">
            <a routerLink="/clientes" class="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 transition hover:gap-2">
              Ver clientes <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>

      <!-- SECCIÓN DE GRÁFICO DINÁMICO (TENDENCIA O DONA) -->
      <div class="mt-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-100">
        <!-- Cabecera del gráfico con el botón selector a la derecha -->
        <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <div class="flex items-center gap-2">
              <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                @if (chartView() === 'trend') {
                  <svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" class="h-4 w-4">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                    <polyline points="16 7 22 7 22 13" />
                  </svg>
                } @else {
                  <svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" class="h-4 w-4 text-amber-500">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                }
              </span>
              <h2 class="text-base font-black text-slate-950">
                {{ chartView() === 'trend' ? 'Tendencia comercial (Últimos 7 días)' : 'Distribución de solicitudes por estado' }}
              </h2>
            </div>
            <p class="mt-0.5 text-xs text-slate-500">
              {{ chartView() === 'trend'
                ? 'Comportamiento diario de ventas generadas y volumen transaccional.'
                : 'Porcentaje y volumen monetario según la fase de cada solicitud.' }}
            </p>
          </div>

          <!-- BOTONES A LA DERECHA PARA CAMBIAR EL GRÁFICO -->
          <div class="flex items-center gap-2">
            <div class="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
              <button
                type="button"
                (click)="chartView.set('trend')"
                [class]="chartView() === 'trend'
                  ? 'bg-white text-slate-950 shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900 font-bold'"
                class="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs transition"
                title="Mostrar gráfico de tendencia"
              >
                <svg class="h-3.5 w-3.5" [class.text-blue-600]="chartView() === 'trend'" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                  <polyline points="16 7 22 7 22 13" />
                </svg>
                Tendencia
              </button>
              <button
                type="button"
                (click)="chartView.set('donut')"
                [class]="chartView() === 'donut'
                  ? 'bg-white text-slate-950 shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900 font-bold'"
                class="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs transition"
                title="Mostrar gráfico de dona"
              >
                <svg class="h-3.5 w-3.5" [class.text-amber-500]="chartView() === 'donut'" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
                Gráfico de dona
              </button>
            </div>

            <button
              type="button"
              (click)="toggleChartView()"
              class="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-blue-400 hover:text-blue-600 active:scale-95"
              title="Cambiar entre gráfico de tendencia y dona"
            >
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              Cambiar gráfico
            </button>
          </div>
        </div>

        <!-- CUERPO DEL GRÁFICO -->
        <div class="p-6">
          @if (chartView() === 'trend') {
            <!-- 1. GRÁFICO DE TENDENCIA -->
            @if (trendData(); as trendInfo) {
              <div class="relative w-full">
                <!-- SVG de Área y Línea -->
                <div class="overflow-x-auto pb-2">
                  <svg viewBox="0 0 700 240" class="h-64 w-full min-w-[550px] overflow-visible select-none">
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.28" />
                        <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.0" />
                      </linearGradient>
                    </defs>

                    <!-- Líneas horizontales de referencia -->
                    @for (step of trendInfo.yAxisSteps; track step.y) {
                      <line
                        x1="70"
                        [attr.y1]="step.y"
                        x2="670"
                        [attr.y2]="step.y"
                        stroke="#f1f5f9"
                        stroke-width="1.5"
                        stroke-dasharray="4 4"
                      />
                      <text
                        x="60"
                        [attr.y]="step.y + 4"
                        text-anchor="end"
                        class="fill-slate-400 text-[10px] font-bold"
                      >
                        {{ step.value | currency: 'COP':'symbol':'1.0-0' }}
                      </text>
                    }

                    <!-- Relleno del área -->
                    <path
                      [attr.d]="trendInfo.areaPath"
                      fill="url(#trendGradient)"
                      class="transition-all duration-300"
                    />

                    <!-- Línea de trazado -->
                    <path
                      [attr.d]="trendInfo.linePath"
                      fill="none"
                      stroke="#2563eb"
                      stroke-width="3"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="transition-all duration-300 drop-shadow-sm"
                    />

                    <!-- Puntos interactivos y columnas hover -->
                    @for (p of trendInfo.points; track p.date; let idx = $index) {
                      <g
                        class="cursor-pointer"
                        (mouseenter)="hoveredTrendIndex.set(idx)"
                        (mouseleave)="hoveredTrendIndex.set(null)"
                      >
                        <!-- Zona transparente de hover amplia -->
                        <rect
                          [attr.x]="p.x - 25"
                          y="15"
                          width="50"
                          height="190"
                          fill="transparent"
                        />

                        <!-- Línea vertical indicadora al pasar el mouse -->
                        @if (hoveredTrendIndex() === idx) {
                          <line
                            [attr.x1]="p.x"
                            y1="20"
                            [attr.x2]="p.x"
                            [attr.y2]="trendInfo.bottomY"
                            stroke="#93c5fd"
                            stroke-width="1.5"
                            stroke-dasharray="3 3"
                          />
                        }

                        <!-- Punto de datos -->
                        <circle
                          [attr.cx]="p.x"
                          [attr.cy]="p.y"
                          [attr.r]="hoveredTrendIndex() === idx ? 6.5 : 4.5"
                          fill="#ffffff"
                          stroke="#2563eb"
                          [attr.stroke-width]="hoveredTrendIndex() === idx ? 3.5 : 2.5"
                          class="transition-all duration-150"
                        />

                        <!-- Etiqueta del eje X -->
                        <text
                          [attr.x]="p.x"
                          y="225"
                          text-anchor="middle"
                          [class]="hoveredTrendIndex() === idx ? 'fill-blue-600 font-black' : 'fill-slate-400 font-bold'"
                          class="text-[11px] transition-colors"
                        >
                          {{ p.label }}
                        </text>

                        <!-- Tooltip desplegable en el punto seleccionado -->
                        @if (hoveredTrendIndex() === idx) {
                          <g class="transition-all duration-200">
                            <rect
                              [attr.x]="p.x - 65"
                              [attr.y]="p.y - 48"
                              width="130"
                              height="40"
                              rx="8"
                              fill="#0f172a"
                              class="shadow-xl"
                            />
                            <polygon
                              [attr.points]="(p.x - 5) + ',' + (p.y - 8) + ' ' + (p.x + 5) + ',' + (p.y - 8) + ' ' + p.x + ',' + (p.y - 2)"
                              fill="#0f172a"
                            />
                            <text
                              [attr.x]="p.x"
                              [attr.y]="p.y - 32"
                              text-anchor="middle"
                              fill="#ffffff"
                              class="text-[11px] font-black"
                            >
                              {{ p.total | currency: 'COP':'symbol':'1.0-0' }}
                            </text>
                            <text
                              [attr.x]="p.x"
                              [attr.y]="p.y - 18"
                              text-anchor="middle"
                              fill="#94a3b8"
                              class="text-[9px] font-semibold"
                            >
                              {{ p.count }} {{ p.count === 1 ? 'venta' : 'ventas' }} · {{ p.label }}
                            </text>
                          </g>
                        }
                      </g>
                    }
                  </svg>
                </div>

                <!-- Resumen inferior de la tendencia -->
                <div class="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
                  <div class="rounded-xl bg-slate-50 p-3.5">
                    <span class="text-xs font-semibold text-slate-500">Ingresos del período:</span>
                    <p class="mt-0.5 text-base font-black text-slate-950 tabular-nums">
                      {{ trendInfo.totalPeriod | currency: 'COP' }}
                    </p>
                  </div>
                  <div class="rounded-xl bg-slate-50 p-3.5">
                    <span class="text-xs font-semibold text-slate-500">Pico de facturación:</span>
                    <p class="mt-0.5 text-base font-black text-blue-600 tabular-nums">
                      {{ trendInfo.peakPoint.total | currency: 'COP' }}
                      <span class="text-xs font-semibold text-slate-500">({{ trendInfo.peakPoint.label }})</span>
                    </p>
                  </div>
                  <div class="rounded-xl bg-slate-50 p-3.5">
                    <span class="text-xs font-semibold text-slate-500">Operaciones en la semana:</span>
                    <p class="mt-0.5 text-base font-black text-slate-950 tabular-nums">
                      {{ trendInfo.totalTransactions }} ventas
                    </p>
                  </div>
                </div>
              </div>
            } @else {
              <div class="py-12 text-center text-sm font-semibold text-slate-400">
                No hay datos suficientes para trazar la tendencia temporal.
              </div>
            }
          } @else {
            <!-- 2. GRÁFICO DE DONAS (DISTRIBUCIÓN POR ESTADO) -->
            @if (donutData(); as donutInfo) {
              <div class="grid items-center gap-8 lg:grid-cols-12">
                <!-- Dona SVG -->
                <div class="flex flex-col items-center justify-center lg:col-span-5">
                  <div class="relative h-60 w-60">
                    <svg viewBox="0 0 240 240" class="h-full w-full -rotate-90 transform select-none">
                      <!-- Anillo base de fondo -->
                      <circle
                        cx="120"
                        cy="120"
                        [attr.r]="donutInfo.radius"
                        fill="none"
                        stroke="#f1f5f9"
                        stroke-width="26"
                      />

                      <!-- Rebanadas de la dona -->
                      @for (slice of donutInfo.slices; track slice.status) {
                        @if (slice.percentage > 0) {
                          <circle
                            cx="120"
                            cy="120"
                            [attr.r]="donutInfo.radius"
                            fill="none"
                            [attr.stroke]="slice.color"
                            stroke-width="26"
                            [attr.stroke-dasharray]="slice.dashArray"
                            [attr.stroke-dashoffset]="slice.dashOffset"
                            class="cursor-pointer transition-all duration-300 hover:opacity-90"
                            (mouseenter)="hoveredDonutStatus.set(slice.status)"
                            (mouseleave)="hoveredDonutStatus.set(null)"
                          />
                        }
                      }
                    </svg>

                    <!-- Centro de la dona con datos de conteo -->
                    <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                      @if (activeDonutSlice(); as active) {
                        <span class="text-[11px] font-black uppercase tracking-wider text-slate-400">{{ active.label }}</span>
                        <span class="text-3xl font-black text-slate-950 tabular-nums">{{ active.count }}</span>
                        <span class="text-xs font-bold" [class]="active.textClass">{{ active.percentage | number: '1.0-1' }}%</span>
                      } @else {
                        <span class="text-[11px] font-black uppercase tracking-wider text-slate-400">Total</span>
                        <span class="text-3xl font-black text-slate-950 tabular-nums">{{ donutInfo.totalCount }}</span>
                        <span class="text-xs font-bold text-slate-500">solicitudes</span>
                      }
                    </div>
                  </div>
                  <p class="mt-3 text-xs text-slate-400">Pasa el cursor sobre una rebanada o tarjeta para ver detalle.</p>
                </div>

                <!-- Desglose por estados (Tarjetas / Leyenda interactiva) -->
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-7">
                  @for (slice of donutInfo.slices; track slice.status) {
                    <div
                      class="flex flex-col justify-between rounded-xl border p-4 transition-all"
                      [class]="hoveredDonutStatus() === slice.status
                        ? 'border-blue-400 bg-blue-50/40 shadow-sm ring-1 ring-blue-300'
                        : 'border-slate-200/80 bg-white hover:border-slate-300'"
                      (mouseenter)="hoveredDonutStatus.set(slice.status)"
                      (mouseleave)="hoveredDonutStatus.set(null)"
                    >
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <span class="h-3 w-3 rounded-full" [style.backgroundColor]="slice.color"></span>
                          <span class="text-xs font-black uppercase tracking-wider text-slate-700">{{ slice.label }}</span>
                        </div>
                        <span class="text-xs font-black text-slate-950">{{ slice.percentage | number: '1.0-1' }}%</span>
                      </div>

                      <div class="mt-3 flex items-baseline justify-between">
                        <div>
                          <p class="text-2xl font-black text-slate-950 tabular-nums">{{ slice.count }}</p>
                          <span class="text-[11px] text-slate-400">{{ slice.count === 1 ? 'operación' : 'operaciones' }}</span>
                        </div>
                        <div class="text-right">
                          <p class="text-xs font-black text-slate-800 tabular-nums">{{ slice.total | currency: 'COP' }}</p>
                          <span class="text-[10px] text-slate-400">acumulado</span>
                        </div>
                      </div>

                      <!-- Barra de progreso miniatura -->
                      <div class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          class="h-full rounded-full transition-all duration-500"
                          [style.width.%]="slice.percentage"
                          [style.backgroundColor]="slice.color"
                        ></div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          }
        </div>
      </div>

      <!-- Barra de accesos directos -->
      <div class="mt-8 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <p class="text-xs font-black uppercase tracking-wider text-slate-400">Accesos rápidos</p>
        <div class="mt-3 flex flex-wrap gap-2.5">
          <a
            routerLink="/ventas/nueva"
            class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-800 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
          >
            <span class="flex h-5 w-5 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-black">+</span>
            Registrar nueva venta
          </a>
          <a
            routerLink="/productos"
            class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-800 transition hover:border-slate-300 hover:bg-white"
          >
            <svg class="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M6 2 3 6h14l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />
            </svg>
            Catálogo de inventario
          </a>
          <a
            routerLink="/clientes"
            class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-800 transition hover:border-slate-300 hover:bg-white"
          >
            <svg class="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8" />
            </svg>
            Directorio de clientes
          </a>
          <a
            routerLink="/solicitudes"
            class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-800 transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-800"
          >
            <svg class="h-4 w-4 text-amber-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M19 8v6M22 11h-6" />
            </svg>
            Solicitudes de registro
          </a>
          <a
            routerLink="/carga-masiva"
            class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-800 transition hover:border-slate-300 hover:bg-white"
          >
            <svg class="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            Carga masiva Excel
          </a>
        </div>
      </div>

      <!-- Tabla de ventas recientes -->
      <div class="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 class="flex items-center gap-2 text-base font-black text-slate-950">
              <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" class="h-4 w-4">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </span>
              Ventas recientes
            </h2>
            <p class="mt-0.5 text-xs text-slate-500">Últimas 5 operaciones registradas en el sistema.</p>
          </div>
          <div class="flex items-center gap-3">
            <a
              routerLink="/ventas"
              [queryParams]="{ status: 'Pending' }"
              class="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 transition"
            >
              Ver solo pendientes
            </a>
            <a routerLink="/ventas" class="inline-flex items-center gap-1 text-xs font-bold text-blue-600 transition hover:gap-2">
              Ver todas <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full min-w-[700px] text-left text-sm">
            <thead class="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th class="px-6 py-4">Venta</th>
                <th class="px-6 py-4">Cliente</th>
                <th class="px-6 py-4">Fecha</th>
                <th class="px-6 py-4">Estado</th>
                <th class="px-6 py-4 text-right">Total</th>
                <th class="px-6 py-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (sale of dashboard.recentSales; track sale.id) {
                <tr
                  class="transition border-l-4"
                  [class]="sale.status === 'Pending'
                    ? 'border-l-amber-500 bg-amber-50/60 hover:bg-amber-100/60'
                    : 'border-l-transparent hover:bg-slate-50'"
                >
                  <td class="px-6 py-4 font-bold text-slate-900">
                    <div class="flex items-center gap-2">
                      <a [routerLink]="['/ventas', sale.id]" class="hover:text-blue-600 hover:underline">
                        {{ sale.saleNumber }}
                      </a>
                      @if (sale.status === 'Pending') {
                        <span class="inline-flex items-center rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-black uppercase text-amber-900 ring-1 ring-amber-300">
                          Pendiente
                        </span>
                      }
                    </div>
                  </td>
                  <td class="px-6 py-4 text-slate-600">{{ sale.customerName }}</td>
                  <td class="px-6 py-4 text-slate-500">{{ sale.saleDate | date: 'dd/MM/yyyy HH:mm' }}</td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1" [class]="salesService.statusClass(sale.status)">
                      <span class="h-1.5 w-1.5 rounded-full bg-current" [class.animate-pulse]="sale.status === 'Pending'" aria-hidden="true"></span>
                      {{ salesService.statusLabel(sale.status) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right font-bold text-slate-900">{{ sale.total | currency: 'COP' }}</td>
                  <td class="px-6 py-4 text-right">
                    <a
                      [routerLink]="['/ventas', sale.id]"
                      title="Ver venta"
                      class="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm transition hover:border-blue-400 hover:text-blue-600"
                    >
                      <app-icon name="eye" [size]="14" />
                      Ver
                    </a>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="px-6 py-16 text-center text-sm font-semibold text-slate-500">
                    Todavía no hay ventas registradas.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  `
})
export class DashboardComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  protected readonly salesService = inject(SalesService);
  private readonly dashboardService = inject(DashboardService);

  protected readonly data = signal<DashboardData | null>(null);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly today = new Date();
  protected readonly todayFormatted = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date());

  // Estado del selector de gráficos ('trend' o 'donut')
  protected readonly chartView = signal<'trend' | 'donut'>('trend');
  protected readonly hoveredTrendIndex = signal<number | null>(null);
  protected readonly hoveredDonutStatus = signal<SaleStatus | null>(null);

  protected readonly greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  });

  protected readonly averageTicket = computed(() => {
    const d = this.data();
    if (!d || d.saleCount === 0) return 0;
    return d.salesTotal / d.saleCount;
  });

  // Datos para el gráfico de tendencia (área y línea SVG)
  protected readonly trendData = computed(() => {
    const d = this.data();
    const trend = d?.trend ?? [];
    if (trend.length === 0) return null;

    const maxTotal = Math.max(...trend.map((t) => t.total), 1);
    const niceMax = Math.ceil(maxTotal * 1.15);

    const left = 70;
    const right = 30;
    const top = 20;
    const bottom = 40;
    const width = 700 - left - right;
    const height = 240 - top - bottom;

    const n = trend.length;
    const points = trend.map((item, i) => {
      const x = n > 1 ? left + (i / (n - 1)) * width : left + width / 2;
      const y = top + height - (item.total / niceMax) * height;
      return { ...item, x, y };
    });

    const linePath = points.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    const bottomY = top + height;
    const areaPath = `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;

    const totalPeriod = trend.reduce((sum, t) => sum + t.total, 0);
    const totalTransactions = trend.reduce((sum, t) => sum + t.count, 0);
    const peakPoint = [...trend].sort((a, b) => b.total - a.total)[0];

    const yAxisSteps = [
      { value: niceMax, y: top },
      { value: Math.round(niceMax * 0.66), y: top + height * 0.34 },
      { value: Math.round(niceMax * 0.33), y: top + height * 0.67 },
      { value: 0, y: top + height }
    ];

    return {
      points,
      linePath,
      areaPath,
      totalPeriod,
      totalTransactions,
      peakPoint,
      yAxisSteps,
      bottomY
    };
  });

  // Datos para el gráfico de dona (distribución por estado SVG)
  protected readonly donutData = computed(() => {
    const d = this.data();
    const distribution = d?.statusDistribution ?? [];
    const totalCount = distribution.reduce((sum, s) => sum + s.count, 0);
    const totalAmount = distribution.reduce((sum, s) => sum + s.total, 0);

    const radius = 78;
    const circumference = 2 * Math.PI * radius;

    const statusConfig: Record<SaleStatus, { label: string; color: string; textClass: string }> = {
      Pending: { label: 'Pendientes', color: '#f59e0b', textClass: 'text-amber-600' },
      Confirmed: { label: 'Confirmadas', color: '#0284c7', textClass: 'text-sky-600' },
      Delivered: { label: 'Entregadas', color: '#10b981', textClass: 'text-emerald-600' },
      Cancelled: { label: 'Canceladas', color: '#f43f5e', textClass: 'text-rose-600' }
    };

    let accumulatedLength = 0;
    const slices = distribution.map((item) => {
      const config = statusConfig[item.status];
      const percentage = totalCount > 0 ? (item.count / totalCount) * 100 : 0;
      const strokeLength = totalCount > 0 ? (item.count / totalCount) * circumference : 0;
      const dashArray = `${strokeLength} ${circumference - strokeLength}`;
      const dashOffset = -accumulatedLength;
      accumulatedLength += strokeLength;

      return {
        status: item.status,
        label: config.label,
        color: config.color,
        textClass: config.textClass,
        count: item.count,
        total: item.total,
        percentage,
        dashArray,
        dashOffset
      };
    });

    return {
      totalCount,
      totalAmount,
      circumference,
      radius,
      slices
    };
  });

  protected readonly activeDonutSlice = computed(() => {
    const status = this.hoveredDonutStatus();
    if (!status) return null;
    return this.donutData()?.slices.find((s) => s.status === status) ?? null;
  });

  ngOnInit(): void {
    this.reload();
  }

  protected toggleChartView(): void {
    this.chartView.set(this.chartView() === 'trend' ? 'donut' : 'trend');
  }

  protected reload(): void {
    this.loading.set(true);
    this.dashboardService.getDashboardData().subscribe({
      next: (dashboard) => {
        this.loading.set(false);
        this.data.set(dashboard);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(toApiError(error).message);
      }
    });
  }
}
