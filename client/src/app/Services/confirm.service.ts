import { Injectable, signal } from '@angular/core';

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  tone: 'danger' | 'default';
}

/**
 * Confirmacion modal reutilizable. Reemplaza a window.confirm() para poder
 * aplicar fondo borroso, animacion de entrada y textos por operacion.
 *
 * Uso:  if (await confirmService.confirm({ title, message })) { ... }
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly state = signal<ConfirmRequest | null>(null);
  private resolver: ((value: boolean) => void) | null = null;

  /** Peticion visible. Es null cuando no hay ningun modal abierto. */
  readonly request = this.state.asReadonly();

  readonly isOpen = signal(false);

  confirm(options: Partial<ConfirmRequest> & Pick<ConfirmRequest, 'title' | 'message'>): Promise<boolean> {
    // Si alguien pide otra confirmacion sin responder la anterior, la cancelamos.
    this.settle(false);

    this.state.set({
      confirmLabel: options.confirmLabel ?? 'Eliminar',
      cancelLabel: options.cancelLabel ?? 'Cancelar',
      tone: options.tone ?? 'danger',
      title: options.title,
      message: options.message
    });
    this.isOpen.set(true);

    return new Promise<boolean>((resolve) => (this.resolver = resolve));
  }

  accept(): void {
    this.settle(true);
  }

  cancel(): void {
    this.settle(false);
  }

  private settle(value: boolean): void {
    const resolve = this.resolver;
    this.resolver = null;
    this.state.set(null);
    this.isOpen.set(false);
    resolve?.(value);
  }
}