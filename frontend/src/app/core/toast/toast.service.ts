import { Injectable, signal } from '@angular/core';

export type ToastTipo = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  mensaje: string;
  tipo: ToastTipo;
  /** true mientras está visible, false durante la salida (fade-out) */
  visible: boolean;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  private nextId = 0;

  /**
   * Muestra un toast.
   * @param mensaje  Texto a mostrar
   * @param tipo     'success' | 'error' | 'info' | 'warning'  (default: 'info')
   * @param duracion Milisegundos hasta el auto-dismiss (default: 3500)
   */
  mostrar(mensaje: string, tipo: ToastTipo = 'info', duracion = 3500): void {
    const id = ++this.nextId;
    const toast: Toast = { id, mensaje, tipo, visible: true };

    this._toasts.update(list => [...list, toast]);

    // Inicia el fade-out un poco antes del remove para que la animación salga
    setTimeout(() => this.iniciarSalida(id), duracion);
    setTimeout(() => this.quitar(id), duracion + 350);
  }

  // Atajos semánticos
  exito(mensaje: string, duracion?: number): void   { this.mostrar(mensaje, 'success', duracion); }
  error(mensaje: string, duracion?: number): void   { this.mostrar(mensaje, 'error',   duracion ?? 5000); }
  info(mensaje: string, duracion?: number): void    { this.mostrar(mensaje, 'info',    duracion); }
  aviso(mensaje: string, duracion?: number): void   { this.mostrar(mensaje, 'warning', duracion); }

  cerrar(id: number): void {
    this.iniciarSalida(id);
    setTimeout(() => this.quitar(id), 350);
  }

  private iniciarSalida(id: number): void {
    this._toasts.update(list =>
      list.map(t => t.id === id ? { ...t, visible: false } : t)
    );
  }

  private quitar(id: number): void {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }
}
