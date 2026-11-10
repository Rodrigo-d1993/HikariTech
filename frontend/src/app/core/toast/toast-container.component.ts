import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Toast, ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" aria-live="polite" aria-atomic="false">
      <div
        *ngFor="let t of toast.toasts(); trackBy: trackById"
        class="toast"
        [class.toast-success]="t.tipo === 'success'"
        [class.toast-error]="t.tipo === 'error'"
        [class.toast-warning]="t.tipo === 'warning'"
        [class.toast-info]="t.tipo === 'info'"
        [class.toast-saliendo]="!t.visible"
        role="alert"
      >
        <span class="toast-icon">{{ icono(t) }}</span>
        <span class="toast-mensaje">{{ t.mensaje }}</span>
        <button class="toast-close" (click)="toast.cerrar(t.id)" aria-label="Cerrar">✕</button>

        <!-- Barra de progreso -->
        <div class="toast-progress" [class.toast-progress-exit]="!t.visible"></div>
      </div>
    </div>
  `,
})
export class ToastContainerComponent {
  constructor(public toast: ToastService) {}

  trackById(_: number, t: Toast): number { return t.id; }

  icono(t: Toast): string {
    const map: Record<string, string> = {
      success: '✓',
      error:   '✕',
      warning: '⚠',
      info:    'ℹ',
    };
    return map[t.tipo] ?? 'ℹ';
  }
}
