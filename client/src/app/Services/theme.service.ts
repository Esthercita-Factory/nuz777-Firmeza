import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'dark' | 'light';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly storageKey = 'firmeza-theme';
  readonly isDark = signal<boolean>(true);

  constructor() {
    this.initTheme();
  }

  private initTheme(): void {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(this.storageKey);
    // Si el usuario guardó explícitamente 'light', usar light.
    // De lo contrario, por defecto modo oscuro puro (OLED).
    if (stored === 'light') {
      this.setDark(false);
    } else {
      this.setDark(true);
    }
  }

  toggle(): void {
    this.setDark(!this.isDark());
  }

  setDark(dark: boolean): void {
    this.isDark.set(dark);
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem(this.storageKey, 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem(this.storageKey, 'light');
    }
  }
}
