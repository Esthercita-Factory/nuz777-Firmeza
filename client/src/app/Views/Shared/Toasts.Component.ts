import { Component, inject } from '@angular/core';
import { ToastService } from '../../Services/imports.service';

@Component({
  selector: 'app-toasts',
  template: `
    <div class="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="toast-enter pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border px-5 py-4 text-sm font-semibold shadow-lg"
          [class]="toastClass(toast.kind)"
          role="status"
        >
          <span class="flex-1">{{ toast.message }}</span>
          <button
            type="button"
            class="text-sm font-bold opacity-60 transition hover:opacity-100"
            (click)="toastService.dismiss(toast.id)"
          >
            ✕
          </button>
        </div>
      }
    </div>
  `
})
export class ToastsComponent {
  protected readonly toastService = inject(ToastService);

  protected toastClass(kind: 'success' | 'error' | 'info'): string {
    switch (kind) {
      case 'success':
        return 'border-emerald-200 bg-emerald-50 text-emerald-800';
      case 'error':
        return 'border-rose-200 bg-rose-50 text-rose-800';
      default:
        return 'border-blue-200 bg-blue-50 text-blue-800';
    }
  }
}
