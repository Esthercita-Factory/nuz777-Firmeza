import { Component, computed, input } from '@angular/core';

/**
 * Iconos de 24x24 con trazo (estilo Feather/Lucide).
 * Cada entrada es la lista de `d` de sus <path>: algunos iconos necesitan
 * mas de un trazo (p. ej. la papelera tiene cuerpo, tapa y manijas).
 */
const ICONS = {
  pencil: ['M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z'],
  trash: [
    'M3 6h18',
    'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6',
    'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
    'M10 11v6',
    'M14 11v6'
  ],
  eye: ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'],
  'arrow-left': ['M19 12H5', 'm12 19-7-7 7-7']
} as const;

export type IconName = keyof typeof ICONS;

@Component({
  selector: 'app-icon',
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      [attr.aria-hidden]="label() ? null : 'true'"
      [attr.aria-label]="label() || null"
      [attr.role]="label() ? 'img' : null"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      viewBox="0 0 24 24"
      class="shrink-0"
    >
      @for (d of paths(); track d) {
        <path [attr.d]="d" />
      }
    </svg>
  `
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input(16);
  /** Texto accesible. Si se omite, el icono se marca como decorativo. */
  readonly label = input<string>('');

  protected readonly paths = computed<readonly string[]>(() => ICONS[this.name()]);
}