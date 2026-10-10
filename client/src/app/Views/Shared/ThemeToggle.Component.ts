import { Component, inject, input } from '@angular/core';
import { ThemeService } from '../../Services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  template: `
    <button
      type="button"
      (click)="theme.toggle()"
      [attr.aria-label]="theme.isDark() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
      [attr.title]="theme.isDark() ? 'Activar modo claro' : 'Activar modo oscuro'"
      class="relative inline-flex items-center justify-center rounded-xl border transition-all duration-200 active:scale-95 cursor-pointer"
      [class]="
        size() === 'sm'
          ? 'h-9 w-9 p-2'
          : 'h-10 w-10 p-2.5'
      "
      [class.theme-toggle-dark]="theme.isDark()"
      [class.theme-toggle-light]="!theme.isDark()"
    >
      @if (theme.isDark()) {
        <!-- Icono Luna / Modo Noche OLED -->
        <svg
          class="h-full w-full text-blue-400 transition-transform duration-300 rotate-0 hover:rotate-12"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          viewBox="0 0 24 24"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      } @else {
        <!-- Icono Sol / Modo Día -->
        <svg
          class="h-full w-full text-amber-500 transition-transform duration-300 rotate-0 hover:rotate-45"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      }
    </button>
  `,
  styles: [
    `
      .theme-toggle-dark {
        background-color: rgba(18, 18, 22, 0.85);
        border-color: rgba(255, 255, 255, 0.12);
        box-shadow: 0 0 15px rgba(59, 130, 246, 0.15);
      }
      .theme-toggle-dark:hover {
        background-color: rgba(28, 28, 35, 0.95);
        border-color: rgba(59, 130, 246, 0.5);
      }
      .theme-toggle-light {
        background-color: rgba(255, 255, 255, 0.9);
        border-color: rgba(226, 232, 240, 0.9);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      }
      .theme-toggle-light:hover {
        background-color: #ffffff;
        border-color: rgba(245, 158, 11, 0.5);
      }
    `
  ]
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeService);
  readonly size = input<'sm' | 'md'>('md');
}
