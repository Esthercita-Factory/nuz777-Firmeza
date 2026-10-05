import { Component, HostListener, inject } from '@angular/core';
import { ConfirmService } from '../../Services/confirm.service';

/**
 * Modal de confirmacion: entra con fade-in, el fondo se difumina con
 * backdrop-blur y el panel escala desde un 96% hasta su tamano final.
 * Se monta una sola vez en app.ts.
 */
@Component({
  selector: 'app-confirm-dialog',
  template: `
    @if (confirmService.request(); as request) {
      <div class="confirm-backdrop" (click)="confirmService.cancel()">
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-message"
          class="confirm-panel"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-start gap-4">
            <span
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
              [class]="request.tone === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6">
                @if (request.tone === 'danger') {
                  <path d="M3 6h18" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                } @else {
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                }
              </svg>
            </span>

            <div class="min-w-0 flex-1">
              <h2 id="confirm-title" class="text-lg font-black text-slate-950">{{ request.title }}</h2>
              <p id="confirm-message" class="mt-2 text-sm leading-6 text-slate-600">{{ request.message }}</p>
            </div>
          </div>

          <div class="mt-7 flex justify-end gap-3">
            <button type="button" class="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50" (click)="confirmService.cancel()">
              {{ request.cancelLabel }}
            </button>
            <button
              type="button"
              class="rounded-xl px-5 py-3 text-sm font-bold text-white shadow-lg transition"
              [class]="request.tone === 'danger' ? 'bg-rose-600 shadow-rose-200 hover:bg-rose-500' : 'bg-blue-600 shadow-blue-200 hover:bg-blue-500'"
              (click)="confirmService.accept()"
            >
              {{ request.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .confirm-backdrop {
        position: fixed;
        inset: 0;
        z-index: 60;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        background-color: rgb(15 23 42 / 0.45);
        backdrop-filter: blur(4px);
        animation: confirm-fade-in 180ms ease-out both;
      }

      .confirm-panel {
        width: 100%;
        max-width: 28rem;
        padding: 1.75rem;
        border-radius: 1.5rem;
        background-color: #fff;
        box-shadow: 0 25px 60px -12px rgb(15 23 42 / 0.35);
        animation: confirm-panel-in 200ms cubic-bezier(0.16, 1, 0.3, 1) both;
      }

      @keyframes confirm-fade-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes confirm-panel-in {
        from {
          opacity: 0;
          transform: translateY(12px) scale(0.96);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .confirm-backdrop,
        .confirm-panel {
          animation: none;
        }
      }
    `
  ]
})
export class ConfirmDialogComponent {
  protected readonly confirmService = inject(ConfirmService);

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.confirmService.request()) {
      this.confirmService.cancel();
    }
  }
}