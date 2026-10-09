import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';
import { Product } from './products.service';

describe('CartService', () => {
  let cart: CartService;

  const producto = (over: Partial<Product> = {}): Product => ({
    id: 'p1',
    sku: 'CEM-001',
    name: 'Cemento',
    description: null,
    category: 'Cementos',
    unit: 'bulto',
    price: 32500,
    stock: 10,
    isActive: true,
    createdAt: '2026-10-05T00:00:00Z',
    updatedAt: null,
    ...over
  });

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    cart = TestBed.inject(CartService);
  });

  it('arranca vacio', () => {
    expect(cart.isEmpty()).toBe(true);
    expect(cart.count()).toBe(0);
    expect(cart.total()).toBe(0);
  });

  it('persiste el carrito en localStorage y se recupera al recargar', () => {
    cart.add(producto(), 2);
    expect(cart.count()).toBe(2);

    // Simula recarga creando una nueva instancia que lee de localStorage
    const nuevoCart = new CartService();
    expect(nuevoCart.count()).toBe(2);
    expect(nuevoCart.lines()).toHaveLength(1);
    expect(nuevoCart.lines()[0].product.id).toBe('p1');
  });

  it('agrega una linea y suma cantidad y total', () => {
    cart.add(producto(), 3);

    expect(cart.isEmpty()).toBe(false);
    expect(cart.count()).toBe(3);
    expect(cart.lines()).toHaveLength(1);
    expect(cart.total()).toBe(97500);
  });

  it('acumula en vez de duplicar la linea si es el mismo producto', () => {
    cart.add(producto(), 2);
    cart.add(producto(), 3);

    expect(cart.lines()).toHaveLength(1);
    expect(cart.quantityOf('p1')).toBe(5);
  });

  it('no deja agregar mas que el stock', () => {
    cart.add(producto({ stock: 4 }), 10);

    expect(cart.quantityOf('p1')).toBe(4);
  });

  it('setQuantity limita al stock y quantity 0 quita la linea', () => {
    cart.add(producto({ stock: 5 }), 1);

    cart.setQuantity('p1', 99);
    expect(cart.quantityOf('p1')).toBe(5);

    cart.setQuantity('p1', 0);
    expect(cart.lines()).toHaveLength(0);
    expect(cart.isEmpty()).toBe(true);
  });

  it('increment y decrement mueven de a uno', () => {
    cart.add(producto(), 2);

    cart.increment('p1');
    expect(cart.quantityOf('p1')).toBe(3);

    cart.decrement('p1');
    cart.decrement('p1');
    cart.decrement('p1');
    expect(cart.quantityOf('p1')).toBe(0);
    expect(cart.isEmpty()).toBe(true);
  });

  it('remove quita una sola linea y conserva las demas', () => {
    cart.add(producto({ id: 'p1' }), 1);
    cart.add(producto({ id: 'p2' }), 2);

    cart.remove('p1');

    expect(cart.lines()).toHaveLength(1);
    expect(cart.quantityOf('p2')).toBe(2);
  });

  it('availableToAdd descuenta lo que ya hay en el carrito', () => {
    cart.add(producto({ stock: 10 }), 4);

    expect(cart.availableToAdd(producto())).toBe(6);
  });

  it('suma varias lineas distintas', () => {
    cart.add(producto({ id: 'p1', price: 100, stock: 10 }), 2);
    cart.add(producto({ id: 'p2', price: 50, stock: 10 }), 3);

    expect(cart.count()).toBe(5);
    expect(cart.total()).toBe(350);
  });

  it('la base y el IVA cuadran con el total, igual que el dominio', () => {
    cart.add(producto({ price: 325000, stock: 10 }), 1);

    const total = cart.total();
    expect(cart.total()).toBe(325000);
    expect(Number((cart.subtotalBase() + cart.iva()).toFixed(2))).toBe(total);
    // 325000 / 1.19 = 273109.24
    expect(cart.subtotalBase()).toBe(273109.24);
    expect(cart.iva()).toBe(51890.76);
  });

  it('clear vacia el carrito', () => {
    cart.add(producto(), 2);
    cart.clear();

    expect(cart.isEmpty()).toBe(true);
    expect(cart.total()).toBe(0);
  });

  it('ignora cantidades no positivas', () => {
    cart.add(producto(), 0);
    cart.add(producto(), -5);

    expect(cart.isEmpty()).toBe(true);
  });
});