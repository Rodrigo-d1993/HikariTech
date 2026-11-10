import { Injectable, signal } from '@angular/core';

/**
 * Permite al Admin alternar entre vista Admin y vista Cliente
 * sin cambiar su rol real. Se persiste en localStorage.
 */
@Injectable({ providedIn: 'root' })
export class ViewModeService {
  private readonly KEY = 'hikaritec_view_mode';

  // Signal reactivo: 'admin' | 'cliente'
  readonly modo = signal<'admin' | 'cliente'>(this.cargarModo());

  private cargarModo(): 'admin' | 'cliente' {
    return (localStorage.getItem(this.KEY) as 'admin' | 'cliente') ?? 'admin';
  }

  toggleModo(): void {
    const nuevo = this.modo() === 'admin' ? 'cliente' : 'admin';
    this.modo.set(nuevo);
    localStorage.setItem(this.KEY, nuevo);
  }

  esVistaAdmin(): boolean {
    return this.modo() === 'admin';
  }

  resetear(): void {
    this.modo.set('admin');
    localStorage.removeItem(this.KEY);
  }
}
