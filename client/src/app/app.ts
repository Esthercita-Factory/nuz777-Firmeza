import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastsComponent } from './Views/Shared/Toasts.Component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastsComponent],
  template: `
    <app-toasts />
    <router-outlet />
  `
})
export class App {}
