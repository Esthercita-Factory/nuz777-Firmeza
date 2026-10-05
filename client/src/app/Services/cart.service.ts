import { Injectable, computed, signal } from '@angular/core';
import { Product } from './products.service';
import { SaleTaxes, TAX_RATE } from './sales.service';

export interface CartLine {
  product: Product;
  quantity: number;
}

/**
 * Carrito de compras del portal del cliente.
 *
 * Vive en memoria (signals), no en la base: al confirmar se convierte en un
 * POST /api/sales. Es la opcion simple y evita una entidad Carrito que hay que
 * migrar, depurar y expirar.
 *
 * Se resetea al recargar la pagina. Para el alcance de la historia alcanza con
 * eso; persistirlo en localStorage es una linea si hace falta.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly items = signal<CartLine[]>([]);

  /** Las lineas del carrito, reactivas. */
  readonly lines = this.items.asReadonly();

  readonly count = computed(() => this.items().reduce((sum, line) => sum + line.quantity, 0));

  readonly isEmpty = computed(() => this.items().length === 0);

  /** Suma de cantidad x precio unitario, con IVA incluido. */
  readonly total = computed(() =>
    this.items().reduce((sum, line) => sum + line.quantity * line.product.price, 0)
  );

  /**
   * Base e IVA. Usa el mismo redondeo que InventoryCalculator en el dominio
   * (AwayFromZero a 2 decimales) para que lo que se ve antes de confirmar sea
   * exactamente lo que se guarda despues.
   */
  readonly taxes = computed<SaleTaxes>(() => {
    const total = this.total();
    const scale = 100;
    const rounded = (value: number) => Math.round(Math.abs(value) * scale + Number.EPSILON) / scale * Math.sign(value);
    const subtotalBase = rounded(total / (1 + TAX_RATE));

    return { subtotalBase, tax: rounded(total - subtotalBase), rate: TAX_RATE };
  });

  readonly subtotalBase = computed(() => this.taxes().subtotalBase);
  readonly iva = computed(() => this.taxes().tax);

  /** Cantidad de una linea por id de producto, para pintar el badge del menu. */
  quantityOf(productId: string): number {
    return this.items().find((line) => line.product.id === productId)?.quantity ?? 0;
  }

  /** Cantidad que todavia se puede agregar sin pasarse del stock. */
  availableToAdd(product: Product): number {
    return Math.max(0, product.stock - this.quantityOf(product.id));
  }

  add(product: Product, quantity = 1): void {
    if (quantity <= 0) return;

    this.items.update((lines) => {
      const existing = lines.find((line) => line.product.id === product.id);

      if (existing) {
        return lines.map((line) =>
          line.product.id === product.id
            ? { ...line, quantity: Math.min(line.quantity + quantity, product.stock) }
            : line
        );
      }

      // No se agrega mas de lo que hay en stock.
      return [...lines, { product, quantity: Math.min(quantity, product.stock) }];
    });
  }

  setQuantity(productId: string, quantity: number): void {
    this.items.update((lines) =>
      lines.map((line) => {
        if (line.product.id !== productId) return line;

        // Cantidad 0 equivale a quitar la linea.
        if (quantity <= 0) return null;
        return { ...line, quantity: Math.min(quantity, line.product.stock) };
      }).filter((line): line is CartLine => line !== null)
    );
  }

  increment(productId: string): void {
    this.setQuantity(productId, this.quantityOf(productId) + 1);
  }

  decrement(productId: string): void {
    this.setQuantity(productId, this.quantityOf(productId) - 1);
  }

  remove(productId: string): void {
    this.items.update((lines) => lines.filter((line) => line.product.id !== productId));
  }

  clear(): void {
    this.items.set([]);
  }
}