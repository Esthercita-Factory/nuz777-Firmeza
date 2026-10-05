import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastsComponent } from './Views/Shared/Toasts.Component';
import { ConfirmDialogComponent } from './Views/Shared/ConfirmDialog.Component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastsComponent, ConfirmDialogComponent],
  template: `
    <app-toasts />
    <app-confirm-dialog />
    <router-outlet />
  `
})
export class App {}
