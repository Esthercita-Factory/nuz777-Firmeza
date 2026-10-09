import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';
import { SaleStatus, SaleSummary } from './sales.service';

/** Respuesta del modal de decision del administrador. */
export interface SaleDecisionAnswer {
  /** False si el admin cerro el modal sin decidir. */
  confirmed: boolean;
  /** Motivo escrito. Vacio cuando confirmo y no escribio nada. */
  note: string;
}

/**
 * Motivo que el administrador deja al confirmar o cancelar una solicitud.
 *
 * Vive aparte de ConfirmService porque ese modal es de un boton y no admite
 * escritura. Aqui hace falta un textarea: al cancelar, el motivo es
 * obligatorio (la API lo rechaza si no viene) y al confirmar es opcional.
 */
@Injectable({ providedIn: 'root' })
export class SaleDecisionService {
  private static readonly SEEN_PREFIX = 'sale_decision_seen_';

  /**
   * Abre el modal de decision.
   *
   * Devuelve `confirmed: false` si el admin se arrepiente, y `confirmed: true`
   * con el motivo escrito cuando decide. Se distingue el cierre del motivo
   * vacio porque aprobar sin comentario es valido, pero cancelar sin escribir
   * nada no lo es.
   */
  async askDecision(options: {
    title: string;
    message: string;
    confirmLabel: string;
    /** Cuando es true, el textarea no se puede dejar vacio. */
    requireNote: boolean;
    notePlaceholder: string;
    tone: 'default' | 'danger';
  }): Promise<SaleDecisionAnswer> {
    const result = await Swal.fire({
      title: options.title,
      html: `
        <p class="text-sm text-slate-600">${options.message}</p>
        <label class="mt-5 block text-left text-xs font-bold uppercase tracking-wider text-slate-700" for="decision-note">
          Motivo ${options.requireNote ? '' : '(opcional)'}
        </label>
        <textarea
          id="decision-note"
          class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          rows="4"
          maxlength="500"
          placeholder="${options.notePlaceholder}"
        ></textarea>
        <p class="mt-2 text-left text-[11px] text-slate-400">
          Este texto es lo que el cliente vera en su panel como respuesta a su solicitud.
        </p>
      `,
      showCancelButton: true,
      confirmButtonText: options.confirmLabel,
      cancelButtonText: 'Volver',
      confirmButtonColor: options.tone === 'danger' ? '#e11d48' : '#0284c7',
      cancelButtonColor: '#64748b',
      focusConfirm: false,
      width: '520px',
      preConfirm: () => {
        const note = (document.getElementById('decision-note') as HTMLTextAreaElement | null)?.value ?? '';

        // Cancelar sin explicacion deja al cliente sin respuesta, asi que el
        // motivo es obligatorio en ese caso.
        if (options.requireNote && !note.trim()) {
          Swal.showValidationMessage('Escribe el motivo: el cliente lo vera en su panel.');
          return false;
        }

        return note.trim() || null;
      }
    });

    if (!result.isConfirmed) {
      return { confirmed: false, note: '' };
    }

    return { confirmed: true, note: ((result.value as string | null) ?? '').trim() };
  }

  /**
   * Devuelve las solicitudes cuya decision el cliente todavia no vio.
   *
   * Solo las que cambiaron de Pendiente: mientras esta pendiente no hay nada
   * que avisar, y una vez mostrada el aviso no se repite al recargar.
   */
  pendingNotices(sales: SaleSummary[]): SaleSummary[] {
    return sales.filter((sale) => sale.status !== 'Pending' && !this.hasSeen(sale.id, sale.status));
  }

  /** Marca la decision como vista para no volver a mostrarla. */
  markSeen(saleId: string, status: SaleStatus): void {
    this.writeSeen(saleId, status);
  }

  /**
   * Muestra en el portal del cliente el motivo de cada decision pendiente.
   * Se avisa de una en una para que el cliente lea cada motivo con calma.
   */
  async notifyDecisions(sales: SaleSummary[]): Promise<void> {
    for (const sale of this.pendingNotices(sales)) {
      const approved = sale.status !== 'Cancelled';

      await Swal.fire({
        title: approved ? 'Tu solicitud fue aprobada' : 'Tu solicitud fue cancelada',
        html: `
          <p class="text-sm text-slate-600">
            Solicitud <span class="font-mono font-bold text-slate-900">${sale.saleNumber}</span>
          </p>
          ${
            sale.decisionNote
              ? `<div class="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-left">
                   <span class="block text-[11px] font-black uppercase tracking-wider text-slate-400">Motivo</span>
                   <p class="mt-1 text-sm leading-6 text-slate-700">${this.escape(sale.decisionNote)}</p>
                 </div>`
              : '<p class="mt-3 text-xs text-slate-400">El administrador no dejo un comentario.</p>'
          }
          ${
            approved
              ? '<p class="mt-3 text-xs text-emerald-600 font-semibold">Estamos preparando la entrega.</p>'
              : '<p class="mt-3 text-xs text-rose-600 font-semibold">El stock no se descontó y podés volver a solicitarlo.</p>'
          }
        `,
        icon: approved ? 'success' : 'warning',
        confirmButtonText: 'Entendido',
        confirmButtonColor: approved ? '#059669' : '#e11d48',
        width: '460px'
      });

      this.markSeen(sale.id, sale.status);
    }
  }

  /** Marca todo como visto. La usa el boton de "enterado" de la lista. */
  markAllSeen(sales: SaleSummary[]): void {
    sales.forEach((sale) => this.writeSeen(sale.id, sale.status));
  }

  private hasSeen(saleId: string, status: SaleStatus): boolean {
    return localStorage.getItem(SaleDecisionService.SEEN_PREFIX + saleId + '_' + status) === 'true';
  }

  private writeSeen(saleId: string, status: SaleStatus): void {
    localStorage.setItem(SaleDecisionService.SEEN_PREFIX + saleId + '_' + status, 'true');
  }

  /**
   * El motivo lo escribe el administrador, asi que se escapa antes de inyectarlo
   * en el HTML del modal: si no, un "<script>" en el motivo se ejecutaria.
   */
  private escape(value: string): string {
    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
  }
}