import { computed, effect, Injectable, signal } from '@angular/core';
import { Producto } from '../../features/productos/producto.service';

export interface CartItem {
  producto: Producto;
  cantidad: number;
}

const CART_KEY = 'hikaritec_carrito';

@Injectable({ providedIn: 'root' })
export class CartService {
  // ── Estado reactivo con signals ──────────────────────────────────────────
  private _items = signal<CartItem[]>(this.cargarDesdeStorage());

  /** Lista de ítems en el carrito (solo lectura) */
  readonly items = this._items.asReadonly();

  /** Total de unidades (para el badge del ícono) */
  readonly totalUnidades = computed(() =>
    this._items().reduce((sum, i) => sum + i.cantidad, 0)
  );

  /** Monto total del carrito */
  readonly totalMonto = computed(() =>
    this._items().reduce((sum, i) => sum + i.producto.precio * i.cantidad, 0)
  );

  /** ¿Está abierto el drawer? */
  readonly abierto = signal(false);

  constructor() {
    // Cada vez que _items cambie, persiste en localStorage automáticamente.
    // effect() se ejecuta tras cada actualización reactiva del signal.
    effect(() => {
      localStorage.setItem(CART_KEY, JSON.stringify(this._items()));
    });
  }

  // ── Operaciones ──────────────────────────────────────────────────────────

  /** Agrega un producto. Si ya existe, incrementa la cantidad. */
  agregar(producto: Producto, cantidad = 1): void {
    this._items.update(items => {
      const idx = items.findIndex(i => i.producto.id === producto.id);
      if (idx >= 0) {
        const nuevaCantidad = Math.min(
          items[idx].cantidad + cantidad,
          producto.stock
        );
        return items.map((item, i) =>
          i === idx ? { ...item, cantidad: nuevaCantidad } : item
        );
      }
      return [...items, { producto, cantidad: Math.min(cantidad, producto.stock) }];
    });
  }

  /** Cambia la cantidad de un ítem directamente. Si llega a 0, lo elimina. */
  setCantidad(productoId: number, cantidad: number): void {
    if (cantidad <= 0) {
      this.eliminar(productoId);
      return;
    }
    this._items.update(items =>
      items.map(i =>
        i.producto.id === productoId ? { ...i, cantidad } : i
      )
    );
  }

  /** Elimina un ítem del carrito. */
  eliminar(productoId: number): void {
    this._items.update(items => items.filter(i => i.producto.id !== productoId));
  }

  /** Vacía el carrito completo y limpia localStorage. */
  vaciar(): void {
    this._items.set([]);
    // El effect persiste el array vacío automáticamente, pero lo borramos
    // directamente para dejar localStorage limpio tras confirmar un pedido.
    localStorage.removeItem(CART_KEY);
  }

  /** Abre o cierra el drawer del carrito. */
  toggleDrawer(): void {
    this.abierto.update(v => !v);
  }

  abrirDrawer(): void  { this.abierto.set(true); }
  cerrarDrawer(): void { this.abierto.set(false); }

  // ── Persistencia ─────────────────────────────────────────────────────────

  /** Carga los ítems guardados en localStorage al inicializar el servicio. */
  private cargarDesdeStorage(): CartItem[] {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as CartItem[];
      // Validación mínima: que sea un array con ítems que tengan producto y cantidad.
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(i => i?.producto?.id != null && i?.cantidad > 0);
    } catch {
      return [];
    }
  }
}
