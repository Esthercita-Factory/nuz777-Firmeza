import { CurrencyPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { toApiError } from '../../Services/Api.Service';
import { AdminNotificationService } from '../../Services/admin-notification.service';
import { CartService } from '../../Services/cart.service';
import { Product, ProductsService } from '../../Services/products.service';
import { ToastService } from '../../Services/imports.service';
import { ConfirmService } from '../../Services/confirm.service';
import { IconComponent } from '../Shared/Icon.Component';

/**
 * Catálogo profesional del portal del cliente con diseño arquitectónico,
 * fondo de edificios, búsqueda en tiempo real, filtros por categoría y control
 * interactivo del carrito de compras.
 */
@Component({
  selector: 'app-shop',
  imports: [FormsModule, RouterLink, CurrencyPipe, IconComponent],
  template: `
    <div class="space-y-8">
      <!-- HERO BANNER CON SKYLINE Y RESUMEN DEL PEDIDO -->
      <section class="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 sm:p-8 lg:p-10 text-white shadow-2xl shadow-slate-950/20">
        <!-- Malla arquitectónica en el banner -->
        <div class="pointer-events-none absolute inset-0 auth-grid opacity-25"></div>
        <div class="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl"></div>
        <div class="pointer-events-none absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-sky-500/15 blur-3xl"></div>

        <!-- Skyline vectorial decorativo de edificios dentro del banner -->
        <svg
          class="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full select-none opacity-20"
          viewBox="0 0 1200 300"
          preserveAspectRatio="xMidYMax slice"
          aria-hidden="true"
        >
          <defs>
            <pattern id="ventanasBanner" width="14" height="18" patternUnits="userSpaceOnUse">
              <rect x="3" y="4" width="6" height="8" fill="#ffffff" opacity=".7" />
            </pattern>
            <g id="edificiosBanner">
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
            <clipPath id="recorteBanner"><use href="#edificiosBanner" /></clipPath>
          </defs>
          <use href="#edificiosBanner" fill="#94a3b8" />
          <rect width="1200" height="300" fill="url(#ventanasBanner)" clip-path="url(#recorteBanner)" />
        </svg>

        <div class="relative z-10 grid gap-8 lg:grid-cols-12 lg:items-center">
          <div class="lg:col-span-8">
            <div class="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-blue-300 backdrop-blur-md">
              <span class="h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>
              Suministros certificados · Ferretería Firmeza
            </div>

            <h1 class="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
              Catálogo de Materiales
            </h1>

            <p class="mt-3 max-w-2xl text-sm sm:text-base text-slate-300 leading-relaxed">
              Consulta existencias en tiempo real, cotiza suministros para construcción o remodelación y realiza tus pedidos con precios directos con IVA incluido.
            </p>

            <!-- Sellos de confianza y servicio -->
            <div class="mt-6 flex flex-wrap gap-4 text-xs font-semibold text-slate-300">
              <div class="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3.5 py-2 backdrop-blur-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4 text-emerald-400">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <span>Stock certificado en tiempo real</span>
              </div>
              <div class="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3.5 py-2 backdrop-blur-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4 text-blue-400">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
                <span>Precios con IVA del 19% desglosado</span>
              </div>
              <div class="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3.5 py-2 backdrop-blur-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4 text-amber-400">
                  <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                  <path d="M15 18H9" />
                  <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14v10" />
                  <circle cx="17" cy="18" r="2" />
                  <circle cx="7" cy="18" r="2" />
                </svg>
                <span>Despacho directo a pie de obra</span>
              </div>
            </div>
          </div>

          <!-- TARJETA FLOTANTE DE RESUMEN DEL CARRITO -->
          <div class="lg:col-span-4">
            <div class="overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-5 shadow-xl backdrop-blur-md">
              <div class="flex items-center justify-between">
                <span class="text-xs font-black uppercase tracking-wider text-slate-300">Tu compra actual</span>
                <span class="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-bold text-blue-300 border border-blue-400/30">
                  {{ cart.count() }} {{ cart.count() === 1 ? 'ítem' : 'ítems' }}
                </span>
              </div>

              <div class="mt-4">
                <p class="text-xs text-slate-400">Total acumulado estimado</p>
                <p class="text-2xl font-black text-white tracking-tight">
                  {{ cart.total() | currency: 'COP' }}
                </p>
                <div class="mt-1 flex items-center justify-between text-[11px] text-slate-300">
                  <span>Base: {{ cart.subtotalBase() | currency: 'COP' }}</span>
                  <span>IVA: {{ cart.iva() | currency: 'COP' }}</span>
                </div>
              </div>

              <div class="mt-5 pt-4 border-t border-white/10">
                <a
                  routerLink="/carrito"
                  class="group flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-xs font-black text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500 active:scale-98"
                >
                  <app-icon name="cart" [size]="15" />
                  <span>Ver carrito y confirmar</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="h-3.5 w-3.5 transition-transform group-hover:translate-x-1">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- BARRA DE BÚSQUEDA Y FILTRADO AVANZADO -->
      <section class="rounded-3xl border border-slate-200/90 bg-white/95 p-5 shadow-sm backdrop-blur-md space-y-4">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <!-- Input de búsqueda -->
          <form class="relative flex-1" (ngSubmit)="search()">
            <span class="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            <input
              name="q"
              [(ngModel)]="queryText"
              placeholder="Buscar por código SKU, nombre o especificación (ej.: CEM-001, Cemento, Tubo)..."
              class="w-full rounded-2xl border border-slate-300 bg-slate-50/60 py-3 pl-10 pr-24 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
            <div class="absolute inset-y-1.5 right-1.5 flex items-center gap-1">
              @if (queryText) {
                <button
                  type="button"
                  (click)="clearSearch()"
                  class="rounded-xl px-2 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-700"
                  title="Limpiar búsqueda"
                >
                  ✕
                </button>
              }
              <button
                type="submit"
                class="rounded-xl bg-slate-950 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-600"
              >
                Buscar
              </button>
            </div>
          </form>

          <!-- Filtros rápidos: Solo stock y Ordenar -->
          <div class="flex flex-wrap items-center gap-3">
            <button
              type="button"
              (click)="toggleOnlyInStock()"
              class="flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition shadow-2xs"
              [class]="onlyInStock() ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'"
            >
              <span class="h-2 w-2 rounded-full" [class]="onlyInStock() ? 'bg-emerald-500' : 'bg-slate-300'"></span>
              Solo con stock
            </button>

            <!-- Selector de ordenamiento -->
            <div class="relative flex items-center">
              <select
                [ngModel]="sortBy()"
                (ngModelChange)="onSortChange($event)"
                class="rounded-xl border border-slate-300 bg-white py-2.5 pl-3 pr-8 text-xs font-bold text-slate-700 shadow-2xs outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="default">Relevancia</option>
                <option value="price-asc">Menor precio</option>
                <option value="price-desc">Mayor precio</option>
                <option value="stock-desc">Mayor stock</option>
                <option value="name-asc">Nombre (A - Z)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- PASTILLAS DE CATEGORÍAS -->
        <div class="border-t border-slate-100 pt-3 flex flex-wrap items-center gap-2">
          <span class="text-[11px] font-black uppercase tracking-wider text-slate-400 mr-1">Categorías:</span>
          @for (cat of categories(); track cat) {
            <button
              type="button"
              (click)="onCategorySelect(cat)"
              class="rounded-xl px-3.5 py-1.5 text-xs font-bold transition"
              [class]="selectedCategory() === cat
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-1 ring-blue-600'
                : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white hover:text-slate-900'"
            >
              {{ categoryLabel(cat) }}
            </button>
          }

          @if (queryText || selectedCategory() !== 'all' || onlyInStock()) {
            <button
              type="button"
              (click)="resetFilters()"
              class="ml-auto text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline"
            >
              Restablecer filtros
            </button>
          }
        </div>
      </section>

      <!-- MENSAJE DE ERROR -->
      @if (errorMessage(); as message) {
        <div class="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 shadow-sm" role="alert">
          {{ message }}
        </div>
      }

      <!-- ESTADO DE CARGA (SKELETONS PULSANTES) -->
      @if (loading()) {
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          @for (skeleton of [1,2,3,4,5,6,7,8]; track skeleton) {
            <div class="animate-pulse rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-sm space-y-4">
              <div class="h-64 rounded-2xl bg-slate-200/80"></div>
              <div class="h-4 w-3/4 rounded-md bg-slate-200/80"></div>
              <div class="h-3 w-1/2 rounded-md bg-slate-200/60"></div>
              <div class="space-y-2 pt-2">
                <div class="h-3 w-full rounded-md bg-slate-200/50"></div>
                <div class="h-3 w-5/6 rounded-md bg-slate-200/50"></div>
              </div>
              <div class="pt-4 flex items-center justify-between">
                <div class="h-6 w-24 rounded-md bg-slate-200/80"></div>
                <div class="h-9 w-28 rounded-xl bg-slate-200/80"></div>
              </div>
            </div>
          }
        </div>
      } @else {
        <!-- REJILLA DE PRODUCTOS DEL CATÁLOGO -->
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          @for (product of displayedProducts(); track product.id) {
            <article class="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/10">
              <div>
                <!-- CABECERA VISUAL / FOTOGRAFÍA REAL DEL MATERIAL -->
                <div class="relative flex h-64 w-full flex-col justify-between overflow-hidden rounded-2xl p-3 border border-slate-200/80 bg-slate-100 shadow-inner group/img">
                  <!-- Imagen contextual real del producto según su tipo/material -->
                  <img
                    [src]="getProductImage(product)"
                    [alt]="product.name"
                    loading="lazy"
                    (error)="onImageError($event)"
                    class="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                  />

                  <!-- Degradado de contraste para legibilidad de textos y chips sobre la fotografía -->
                  <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-slate-950/50"></div>

                  <!-- Chips superiores: SKU y Disponibilidad -->
                  <div class="relative z-10 flex items-center justify-between gap-2">
                    <span class="rounded-lg bg-white/95 px-2 py-0.5 font-mono text-[10px] font-black text-slate-800 shadow-sm border border-white/60 backdrop-blur-md">
                      {{ product.sku }}
                    </span>

                    <span
                      class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-sm text-white backdrop-blur-md"
                      [class]="product.stock > 10
                        ? 'bg-emerald-600/90 ring-1 ring-emerald-400/60'
                        : product.stock > 0
                          ? 'bg-amber-600/90 ring-1 ring-amber-400/60'
                          : 'bg-rose-600/90 ring-1 ring-rose-400/60'"
                    >
                      @if (product.stock > 0) {
                        <span class="h-1.5 w-1.5 rounded-full bg-white animate-pulse"></span>
                      }
                      {{ product.stock > 10 ? 'En stock' : product.stock > 0 ? 'Últimas ' + product.stock : 'Agotado' }}
                    </span>
                  </div>

                  <!-- Pie de la cabecera visual: Categoría y Unidad sobre la imagen -->
                  <div class="relative z-10 flex items-center justify-between text-[11px] font-bold text-white drop-shadow-sm">
                    <span class="rounded-md bg-slate-950/75 px-2 py-0.5 border border-white/15 backdrop-blur-md">
                      {{ product.category }}
                    </span>
                    <span class="rounded-md bg-slate-950/75 px-2 py-0.5 border border-white/15 backdrop-blur-md">
                      x {{ product.unit }}
                    </span>
                  </div>
                </div>

                <!-- DATOS DEL MATERIAL -->
                <div class="mt-4">
                  <h3 class="text-base font-black text-slate-950 transition-colors group-hover:text-blue-600 line-clamp-2">
                    {{ product.name }}
                  </h3>

                  @if (product.description) {
                    <p class="mt-1.5 text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {{ product.description }}
                    </p>
                  } @else {
                    <p class="mt-1.5 text-xs text-slate-400 italic">
                      Material certificado para uso industrial y residencial.
                    </p>
                  }
                </div>
              </div>

              <!-- SECCIÓN INFERIOR: PRECIO, BARRA DE STOCK Y ACCIÓN DE COMPRA -->
              <div class="mt-5 pt-4 border-t border-slate-100">
                <div class="flex items-baseline justify-between">
                  <div>
                    <p class="text-xs font-semibold text-slate-400">Precio unitario</p>
                    <p class="text-xl font-black text-slate-950 tracking-tight">
                      {{ product.price | currency: 'COP' }}
                    </p>
                  </div>
                  <span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    IVA 19% inc.
                  </span>
                </div>

                <!-- Barra de disponibilidad de inventario -->
                <div class="mt-2.5">
                  <div class="flex items-center justify-between text-[10px] font-semibold text-slate-400 mb-1">
                    <span>Disponibilidad</span>
                    <span class="font-bold text-slate-600">{{ product.stock }} {{ product.unit }}s</span>
                  </div>
                  <div class="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      [class]="product.stock > 10 ? 'bg-emerald-500' : product.stock > 0 ? 'bg-amber-500' : 'bg-rose-500'"
                      [style.width.%]="stockPercentage(product)"
                    ></div>
                  </div>
                </div>

                <!-- ACCIONES DE COMPRA -->
                <div class="mt-4">
                  @if (cart.quantityOf(product.id) > 0) {
                    <!-- Control interactivo: en carrito -->
                    <div class="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/70 p-1">
                      <button
                        type="button"
                        (click)="decrementCart(product)"
                        class="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-700 font-black shadow-xs transition hover:bg-slate-100 active:scale-95"
                        title="Quitar una unidad"
                      >
                        −
                      </button>

                      <div class="text-center px-2">
                        <span class="block text-xs font-black text-blue-900 leading-tight">
                          {{ cart.quantityOf(product.id) }} en carrito
                        </span>
                        <span class="block text-[9px] font-semibold text-blue-600">
                          máx. {{ product.stock }}
                        </span>
                      </div>

                      <button
                        type="button"
                        (click)="incrementCart(product)"
                        [disabled]="cart.quantityOf(product.id) >= product.stock"
                        class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-black shadow-xs transition hover:bg-blue-500 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                        title="Agregar una unidad más"
                      >
                        +
                      </button>
                    </div>
                  } @else {
                    <!-- Botón normal para agregar al carrito -->
                    <button
                      type="button"
                      class="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-xs font-black text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-500 active:scale-98 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
                      [disabled]="product.stock <= 0"
                      (click)="add(product)"
                    >
                      @if (product.stock <= 0) {
                        <span>Sin existencias</span>
                      } @else {
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="h-4 w-4">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                        <span>Agregar al carrito</span>
                      }
                    </button>
                  }
                </div>
              </div>
            </article>
          } @empty {
            <div class="rounded-3xl border border-slate-200 bg-white/90 p-12 text-center shadow-sm sm:col-span-2 lg:col-span-3 xl:col-span-4">
              <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-8 w-8">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
              <h3 class="mt-4 text-base font-bold text-slate-800">No se encontraron productos</h3>
              <p class="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                No hay materiales que coincidan con los criterios seleccionados. Prueba con otro término o limpia los filtros.
              </p>
              <button
                type="button"
                (click)="resetFilters()"
                class="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-600"
              >
                Ver todos los productos
              </button>
            </div>
          }
        </div>
      }

      <!-- PAGINACIÓN ELEGANTE -->
      @if (totalPages() > 1) {
        <nav class="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white/95 px-6 py-4 shadow-sm backdrop-blur-md" aria-label="Paginación del catálogo">
          <p class="text-xs font-semibold text-slate-500">
            Mostrando página <span class="font-bold text-slate-900">{{ page() }}</span> de <span class="font-bold text-slate-900">{{ totalPages() }}</span> (Total {{ totalCount() }} materiales)
          </p>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              [disabled]="page() <= 1"
              (click)="goToPage(page() - 1)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="h-3.5 w-3.5">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Anterior
            </button>

            <span class="rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700 border border-blue-200">
              {{ page() }} / {{ totalPages() }}
            </span>

            <button
              type="button"
              class="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              [disabled]="page() >= totalPages()"
              (click)="goToPage(page() + 1)"
            >
              Siguiente
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="h-3.5 w-3.5">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </nav>
      }
    </div>
  `
})
export class ShopComponent implements OnInit, OnDestroy {
  protected readonly cart = inject(CartService);
  private readonly productsService = inject(ProductsService);
  private readonly notificationService = inject(AdminNotificationService);
  private readonly toastService = inject(ToastService);
  private readonly confirmService = inject(ConfirmService);

  private static readonly CAPACITIES_KEY = 'firmeza_product_capacities';
  private stockChangeSub?: Subscription;

  protected readonly products = signal<Product[]>([]);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly page = signal(1);
  protected readonly totalPages = signal(0);
  protected readonly totalCount = signal(0);

  protected queryText = '';
  protected readonly selectedCategory = signal<string>('all');
  protected readonly onlyInStock = signal<boolean>(false);
  protected readonly sortBy = signal<'default' | 'price-asc' | 'price-desc' | 'stock-desc' | 'name-asc'>('default');

  protected readonly defaultCategories = [
    'Cementos',
    'Aceros',
    'Mampostería',
    'Acabados',
    'Herramientas',
    'Tuberías',
    'Eléctricos'
  ];

  /** Lista de categorías disponibles para el filtro */
  protected readonly categories = computed(() => {
    const set = new Set<string>();
    for (const p of this.products()) {
      if (p.category && p.category.trim()) {
        set.add(p.category.trim());
      }
    }
    for (const def of this.defaultCategories) {
      set.add(def);
    }
    return ['all', ...Array.from(set)];
  });

  /** Lista calculada con filtros locales de ordenamiento y existencias */
  protected readonly displayedProducts = computed(() => {
    let list = [...this.products()];

    if (this.onlyInStock()) {
      list = list.filter((p) => p.stock > 0);
    }

    const sort = this.sortBy();
    if (sort === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sort === 'stock-desc') {
      list.sort((a, b) => b.stock - a.stock);
    } else if (sort === 'name-asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  });

  ngOnInit(): void {
    this.load();
    this.stockChangeSub = this.notificationService.stockOrSaleChanged$.subscribe(() => {
      // Recargar catálogo silenciosamente en tiempo real al confirmar ventas o actualizar stock
      this.load(true);
    });
  }

  ngOnDestroy(): void {
    this.stockChangeSub?.unsubscribe();
  }

  protected search(): void {
    this.page.set(1);
    this.load();
  }

  protected clearSearch(): void {
    this.queryText = '';
    this.page.set(1);
    this.load();
  }

  protected onCategorySelect(cat: string): void {
    this.selectedCategory.set(cat);
    this.page.set(1);
    this.load();
  }

  protected categoryLabel(cat: string): string {
    return cat === 'all' ? 'Todas las categorías' : cat;
  }

  protected toggleOnlyInStock(): void {
    this.onlyInStock.update((val) => !val);
  }

  protected onSortChange(value: 'default' | 'price-asc' | 'price-desc' | 'stock-desc' | 'name-asc'): void {
    this.sortBy.set(value);
  }

  protected resetFilters(): void {
    this.queryText = '';
    this.selectedCategory.set('all');
    this.onlyInStock.set(false);
    this.sortBy.set('default');
    this.page.set(1);
    this.load();
  }

  protected goToPage(page: number): void {
    this.page.set(page);
    this.load();
  }

  /**
   * Obtiene o calcula la capacidad de referencia (tope visual) para el producto.
   * Si las existencias disminuyen (por compras confirmadas), la capacidad de referencia se mantiene,
   * permitiendo que la barra visual baje de forma visible y proporcional.
   * Si el administrador reabastece el producto a una cantidad mayor, la capacidad sube acordemente.
   */
  private getCapacityFor(productId: string, currentStock: number): number {
    if (currentStock <= 0) return 1;

    let capacities: Record<string, number> = {};
    try {
      const raw = localStorage.getItem(ShopComponent.CAPACITIES_KEY);
      if (raw) {
        capacities = JSON.parse(raw);
      }
    } catch {
      // Ignorar fallback si localStorage no está disponible
    }

    const saved = capacities[productId];
    const nominalMilestone = this.calculateMilestone(currentStock);
    const capacity = Math.max(saved ?? 0, nominalMilestone, currentStock);

    if (saved !== capacity) {
      capacities[productId] = capacity;
      try {
        localStorage.setItem(ShopComponent.CAPACITIES_KEY, JSON.stringify(capacities));
      } catch {
        // Ignorar fallback
      }
    }

    return capacity;
  }

  private calculateMilestone(stock: number): number {
    if (stock <= 0) return 10;
    if (stock <= 10) return 15;
    if (stock <= 25) return 30;
    if (stock <= 50) return 60;
    if (stock <= 100) return 120;
    return Math.ceil((stock * 1.1) / 10) * 10;
  }

  protected stockPercentage(product: Product): number {
    if (product.stock <= 0) return 0;
    const capacity = this.getCapacityFor(product.id, product.stock);
    const pct = Math.round((product.stock / capacity) * 100);
    return Math.min(100, Math.max(6, pct));
  }

  /**
   * Obtiene la ruta de la fotografía representativa según el material, categoría o SKU.
   */
  protected getProductImage(product: Product): string {
    const text = `${product.sku || ''} ${product.name || ''} ${product.category || ''} ${product.description || ''}`.toLowerCase();

    if (text.includes('cemento') || text.includes('concreto') || text.includes('mortero') || text.includes('cem-')) {
      return 'img/products/cemento.jpg';
    }
    if (
      text.includes('arena') ||
      text.includes('agregado') ||
      text.includes('grava') ||
      text.includes('gravilla') ||
      text.includes('triturado') ||
      text.includes('are-')
    ) {
      return 'img/products/arena.jpg';
    }
    if (
      text.includes('ladrillo') ||
      text.includes('bloque') ||
      text.includes('mampost') ||
      text.includes('adoquin') ||
      text.includes('lad-')
    ) {
      return 'img/products/ladrillo.jpg';
    }
    if (
      text.includes('acero') ||
      text.includes('varilla') ||
      text.includes('hierro') ||
      text.includes('rebar') ||
      text.includes('malla') ||
      text.includes('alambr') ||
      text.includes('ace-')
    ) {
      return 'img/products/acero.jpg';
    }
    if (
      text.includes('tub') ||
      text.includes('pvc') ||
      text.includes('fontan') ||
      text.includes('plomer') ||
      text.includes('codo') ||
      text.includes('valvula')
    ) {
      return 'img/products/tuberia.jpg';
    }
    if (
      text.includes('herramienta') ||
      text.includes('equipo') ||
      text.includes('martillo') ||
      text.includes('taladro') ||
      text.includes('pala') ||
      text.includes('disco') ||
      text.includes('her-')
    ) {
      return 'img/products/herramientas.jpg';
    }
    if (
      text.includes('pintur') ||
      text.includes('acabado') ||
      text.includes('esmalte') ||
      text.includes('estuco') ||
      text.includes('impermeab') ||
      text.includes('pin-')
    ) {
      return 'img/products/pintura.jpg';
    }
    if (
      text.includes('electr') ||
      text.includes('cable') ||
      text.includes('ilumin') ||
      text.includes('breaker') ||
      text.includes('enchufe') ||
      text.includes('ele-')
    ) {
      return 'img/products/electrico.jpg';
    }
    if (
      text.includes('mader') ||
      text.includes('tabla') ||
      text.includes('liston') ||
      text.includes('triplay') ||
      text.includes('mad-')
    ) {
      return 'img/products/madera.jpg';
    }
    return 'img/products/general.jpg';
  }

  /** Manejo seguro de error 404/fallback para imágenes */
  protected onImageError(event: Event): void {
    const target = event.target as HTMLImageElement | null;
    if (target && !target.src.endsWith('img/products/general.jpg')) {
      target.src = 'img/products/general.jpg';
    }
  }

  protected add(product: Product): void {
    const available = this.cart.availableToAdd(product);
    if (available <= 0) {
      this.toastService.error('No hay más unidades disponibles de este producto.');
      return;
    }

    this.cart.add(product, 1);
    this.toastService.success(`${product.name} agregado al carrito.`);
  }

  protected incrementCart(product: Product): void {
    const available = this.cart.availableToAdd(product);
    if (available <= 0) {
      this.toastService.error(`Alcanzaste el límite de existencias de ${product.name} (${product.stock} unid).`);
      return;
    }
    this.cart.increment(product.id);
  }

  protected decrementCart(product: Product): void {
    this.cart.decrement(product.id);
  }

  private load(silent = false): void {
    if (!silent) {
      this.loading.set(true);
    }
    this.errorMessage.set(null);

    let qParam = this.queryText.trim();
    if (this.selectedCategory() !== 'all') {
      qParam = qParam ? `${qParam} ${this.selectedCategory()}` : this.selectedCategory();
    }

    this.productsService
      .list({
        q: qParam || undefined,
        onlyActive: true,
        page: this.page(),
        pageSize: 12
      })
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          this.products.set(response.items);
          this.page.set(response.page);
          this.totalPages.set(response.totalPages);
          this.totalCount.set(response.totalCount);
          this.cart.syncWithProducts(response.items);
        },
        error: (error) => {
          this.loading.set(false);
          this.errorMessage.set(toApiError(error).message);
        }
      });
  }
}