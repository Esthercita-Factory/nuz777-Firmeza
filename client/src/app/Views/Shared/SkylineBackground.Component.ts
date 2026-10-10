import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Fondo arquitectónico con silueta de edificios (skyline corporativo) y malla sutil.
 * Utilizado para dar identidad institucional a pantallas de detalle y portales.
 */
@Component({
  selector: 'app-skyline-background',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Malla de fondo arquitectónica sutil -->
    <div class="pointer-events-none fixed inset-0 auth-grid opacity-30 transform-gpu z-0"></div>

    <!-- Skyline vectorial decorativo de edificios en la base -->
    <svg
      class="pointer-events-none fixed inset-x-0 bottom-0 z-0 h-64 w-full select-none opacity-40 transform-gpu"
      viewBox="0 0 1200 300"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <defs>
        <pattern id="ventanasSkyline" width="14" height="18" patternUnits="userSpaceOnUse">
          <rect x="3" y="4" width="6" height="8" fill="#ffffff" opacity=".85" />
        </pattern>
        <g id="edificiosSkyline">
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
        <clipPath id="recorteSkyline"><use href="#edificiosSkyline" /></clipPath>
      </defs>

      <use href="#edificiosSkyline" fill="#cbd5e1" opacity=".55" />
      <rect width="1200" height="300" fill="url(#ventanasSkyline)" clip-path="url(#recorteSkyline)" opacity=".65" />

      <g fill="#bfdbfe" opacity=".7">
        <rect x="40" y="200" width="100" height="100" />
        <rect x="140" y="170" width="70" height="130" />
        <rect x="230" y="210" width="120" height="90" />
        <rect x="380" y="180" width="80" height="120" />
        <rect x="490" y="220" width="110" height="80" />
        <rect x="640" y="190" width="90" height="110" />
        <rect x="760" y="215" width="120" height="85" />
        <rect x="910" y="185" width="80" height="115" />
        <rect x="1020" y="210" width="110" height="90" />
      </g>
    </svg>
  `
})
export class SkylineBackgroundComponent {}
