import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';
import { CartService } from '../../core/cart/cart.service';
import { ToastService } from '../../core/toast/toast.service';
import { RoleService } from '../../core/auth/role.service';
import { ViewModeService } from '../../core/auth/view-mode.service';
import { Producto, ProductoService } from './producto.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <!-- Hero Banner -->
    <div class="hero-banner">
      <div>
        <h1>Catálogo Gamer</h1>
        <p>Los mejores periféricos y equipos para llevar tu setup al siguiente nivel</p>
      </div>
      <div class="hero-icon">🎮</div>
    </div>

    <!-- ── Toolbar ───────────────────────────────────────────────────────── -->
    <div class="toolbar">
      <h2 class="page-title">Productos
        <span style="font-size:.9rem;color:var(--text-muted);font-family:'Inter',sans-serif;font-weight:400"
              *ngIf="!cargando">({{ productosFiltrados.length }})</span>
      </h2>
      <button class="btn btn-purple" *ngIf="modoAdmin" (click)="abrirModalCrear()">+ Nuevo producto</button>
    </div>

    <!-- ── Búsqueda + filtro categoría ───────────────────────────────────── -->
    <div class="search-filter-bar">

      <!-- Input de búsqueda -->
      <div class="search-input-wrap">
        <span class="search-icon">🔍</span>
        <input
          class="search-input"
          type="text"
          [(ngModel)]="textoBusqueda"
          (ngModelChange)="onBusquedaChange($event)"
          placeholder="Buscar por nombre, descripción o categoría..."
          autocomplete="off"
        >
        <button
          class="search-clear-btn"
          *ngIf="textoBusqueda"
          (click)="limpiarBusqueda()"
          title="Limpiar búsqueda"
        >✕</button>
      </div>

      <!-- Chips de categoría -->
      <div class="cat-filter" *ngIf="categorias.length > 0">
        <button class="cat-btn" [class.cat-btn-active]="categoriaActiva === null"
                (click)="filtrarCategoria(null)">Todos</button>
        <button class="cat-btn" *ngFor="let c of categorias"
                [class.cat-btn-active]="categoriaActiva === c"
                (click)="filtrarCategoria(c)">{{ c }}</button>
      </div>
    </div>

    <!-- ── Skeleton loading ──────────────────────────────────────────────── -->
    <div class="products-grid" *ngIf="cargando">
      <div class="skeleton-card" *ngFor="let i of [1,2,3,4,5,6,7,8]">
        <div class="skeleton skeleton-img"></div>
        <div class="skeleton-body">
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-desc"></div>
          <div class="skeleton skeleton-desc2"></div>
          <div class="skeleton skeleton-price"></div>
          <div class="skeleton skeleton-btn"></div>
        </div>
      </div>
    </div>

    <!-- ── Sin productos en DB ───────────────────────────────────────────── -->
    <div class="empty-state" *ngIf="!cargando && !error && productos.length === 0">
      <div class="empty-icon">🎮</div>
      <p>No hay productos. <span *ngIf="modoAdmin">¡Agrega el primero!</span></p>
    </div>

    <!-- ── Sin resultados de búsqueda ────────────────────────────────────── -->
    <div class="empty-state search-empty" *ngIf="!cargando && !error && productos.length > 0 && productosFiltrados.length === 0">
      <div class="empty-icon">🔍</div>
      <p>Sin resultados para <strong>"{{ textoBusqueda || categoriaActiva }}"</strong></p>
      <button class="btn btn-ghost btn-sm" (click)="limpiarFiltros()">Limpiar filtros</button>
    </div>

    <!-- ── Grid de productos ─────────────────────────────────────────────── -->
    <div class="products-grid" *ngIf="!cargando">
      <div class="product-card" *ngFor="let p of productosFiltrados">

        <!-- Imagen — clic navega al detalle -->
        <div class="product-img-wrap">
          <a [routerLink]="['/productos', p.id]" class="product-img-link">
            <img *ngIf="p.imagenUrl" [src]="p.imagenUrl" [alt]="p.nombre" (error)="onImgError($event)">
            <div class="product-img-placeholder" *ngIf="!p.imagenUrl">
              <span>🎮</span><span>Sin imagen</span>
            </div>
            <div class="out-of-stock-overlay" *ngIf="p.stock <= 0">SIN STOCK</div>
          </a>
        </div>

        <!-- Info con texto resaltado en búsqueda -->
        <div class="product-info">
          <a [routerLink]="['/productos', p.id]" class="product-name-link">
            <div class="product-name"
                 [innerHTML]="resaltar(p.nombre)"></div>
          </a>
          <div class="product-desc"
               [innerHTML]="resaltar(p.descripcion)"></div>
          <div class="product-price">{{ p.precio | currency:'CLP':'symbol-narrow':'1.0-0' }}</div>
          <div class="product-stock"
               [class.stock-ok]="p.stock > 10"
               [class.stock-low]="p.stock > 0 && p.stock <= 10"
               [class.stock-empty]="p.stock <= 0">
            {{ p.stock <= 0 ? '✗ Sin stock' : p.stock <= 10 ? '⚠ Stock: ' + p.stock : '✓ Stock: ' + p.stock }}
          </div>

          <!-- Selector cantidad (solo cliente con stock) -->
          <div class="qty-control" *ngIf="!modoAdmin && p.stock > 0">
            <button (click)="decrementar(p)" [disabled]="(cantidades.get(p.id!) ?? 1) <= 1">−</button>
            <span>{{ cantidades.get(p.id!) ?? 1 }}</span>
            <button (click)="incrementar(p)" [disabled]="(cantidades.get(p.id!) ?? 1) >= p.stock">+</button>
          </div>
        </div>

        <!-- Acciones -->
        <div class="product-actions">

          <!-- CLIENTE -->
          <ng-container *ngIf="!modoAdmin">
            <button class="btn btn-primary btn-full"
                    (click)="agregarAlCarrito(p)"
                    [disabled]="p.stock <= 0">
              {{ p.stock <= 0 ? 'Sin stock' : agregadoId === p.id ? '✓ Agregado' : '🛒 Agregar al carrito' }}
            </button>
          </ng-container>

          <!-- ADMIN -->
          <ng-container *ngIf="modoAdmin">
            <button class="btn btn-purple btn-full" (click)="abrirModalEditar(p)">Editar</button>
            <button class="btn btn-danger btn-sm btn-full"
                    (click)="eliminar(p)"
                    [disabled]="eliminandoId === p.id">
              {{ eliminandoId === p.id ? 'Eliminando...' : 'Eliminar' }}
            </button>
          </ng-container>

        </div>
      </div>
    </div>

    <!-- ── Modal crear / editar ───────────────────────────────────────────── -->
    <div class="modal-overlay" *ngIf="modalAbierto" (click)="$event.target === $event.currentTarget && cerrarModal()">
      <div class="modal">
        <h3>{{ modoEdicion ? 'Editar producto' : 'Nuevo producto' }}</h3>

        <div class="form-group">
          <label>Nombre *</label>
          <input [(ngModel)]="form.nombre" placeholder="Ej: Teclado mecánico RGB">
        </div>
        <div class="form-group">
          <label>Descripción</label>
          <textarea [(ngModel)]="form.descripcion" placeholder="Descripción del producto"></textarea>
        </div>
        <div class="form-group">
          <label>Precio (CLP) *</label>
          <input type="number" [(ngModel)]="form.precio" placeholder="Ej: 59990" min="1">
        </div>
        <div class="form-group">
          <label>Stock *</label>
          <input type="number" [(ngModel)]="form.stock" placeholder="Ej: 20" min="0">
        </div>
        <div class="form-group">
          <label>Categoría</label>
          <select [(ngModel)]="form.categoria">
            <option value="">Sin categoría</option>
            <option *ngFor="let c of categorias" [value]="c">{{ c }}</option>
            <option value="__nueva__">+ Nueva categoría...</option>
          </select>
          <input *ngIf="form.categoria === '__nueva__'"
                 [(ngModel)]="nuevaCategoria"
                 placeholder="Ej: Teclados"
                 style="margin-top:6px">
        </div>
        <div class="form-group">
          <label>URL de imagen <span style="color:var(--text-muted);font-weight:400">(opcional)</span></label>
          <input [(ngModel)]="form.imagenUrl" placeholder="https://ejemplo.com/imagen.jpg">
          <div *ngIf="form.imagenUrl"
               style="margin-top:8px;border-radius:8px;overflow:hidden;height:120px;background:var(--bg3)">
            <img [src]="form.imagenUrl" style="width:100%;height:100%;object-fit:cover"
                 (error)="form.imagenUrl = ''">
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-ghost" (click)="cerrarModal()">Cancelar</button>
          <button class="btn btn-primary" (click)="guardarProducto()" [disabled]="guardando">
            {{ guardando ? 'Guardando...' : modoEdicion ? 'Guardar cambios' : 'Crear producto' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ProductosComponent implements OnInit, OnDestroy {
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  categorias: string[] = [];
  categoriaActiva: string | null = null;
  textoBusqueda = '';

  cargando = true;
  error    = '';
  esAdmin = false;  eliminandoId: number | null = null;
  cantidades = new Map<number, number>();
  agregadoId: number | null = null;

  modalAbierto = false;
  modoEdicion = false;
  editandoId: number | null = null;
  guardando = false;
  errorModal = '';
  form: Partial<Producto> = {};
  nuevaCategoria = '';
  // Subject para aplicar debounce al input de búsqueda
  private busqueda$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private productoService: ProductoService,
    private auth: AuthService,
    private role: RoleService,
    private viewMode: ViewModeService,
    private router: Router,
    private route: ActivatedRoute,
    public cartService: CartService,
    private toastSvc: ToastService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.esAdmin = await this.role.isAdmin();
    this.cargarProductos();

    // Debounce de 250 ms para no filtrar en cada tecla
    this.busqueda$
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(texto => this.aplicarFiltros(texto, this.categoriaActiva));

    // Categoría desde query param (enlaces del footer)
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['categoria']) {
        const esperar = setInterval(() => {
          if (!this.cargando) {
            this.filtrarCategoria(params['categoria']);
            clearInterval(esperar);
          }
        }, 100);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get modoAdmin(): boolean {
    return this.esAdmin && this.viewMode.esVistaAdmin();
  }

  // ── Carga inicial ─────────────────────────────────────────────────────────
  cargarProductos(): void {
    this.cargando = true;
    this.productoService.listar().subscribe({
      next: data => {
        this.productos = data;
        this.aplicarFiltros(this.textoBusqueda, this.categoriaActiva);
        this.cargando = false;
      },
      error: err => {
        this.toastSvc.error(this.msgError(err, 'No se pudieron cargar los productos'));
        this.cargando = false;
      },
    });
    this.productoService.listarCategorias().subscribe({
      next: cats => (this.categorias = cats),
    });
  }

  // ── Búsqueda ──────────────────────────────────────────────────────────────

  /** Llamado por (ngModelChange) — emite al Subject para el debounce */
  onBusquedaChange(texto: string): void {
    this.busqueda$.next(texto);
  }

  limpiarBusqueda(): void {
    this.textoBusqueda = '';
    this.aplicarFiltros('', this.categoriaActiva);
  }

  limpiarFiltros(): void {
    this.textoBusqueda = '';
    this.categoriaActiva = null;
    this.aplicarFiltros('', null);
  }

  // ── Filtrado por categoría ────────────────────────────────────────────────
  filtrarCategoria(cat: string | null): void {
    this.categoriaActiva = cat;
    this.aplicarFiltros(this.textoBusqueda, cat);
  }

  // ── Lógica central de filtrado ────────────────────────────────────────────
  /**
   * Combina búsqueda por texto Y filtro por categoría.
   * El texto se busca en nombre, descripción y categoría (case-insensitive).
   */
  private aplicarFiltros(texto: string, categoria: string | null): void {
    const q = texto.trim().toLowerCase();

    this.productosFiltrados = this.productos.filter(p => {
      const coincideCategoria = !categoria || p.categoria === categoria;
      if (!q) return coincideCategoria;

      const coincideTexto =
        p.nombre.toLowerCase().includes(q) ||
        (p.descripcion ?? '').toLowerCase().includes(q) ||
        (p.categoria ?? '').toLowerCase().includes(q);

      return coincideCategoria && coincideTexto;
    });
  }

  // ── Resaltado de coincidencias ────────────────────────────────────────────
  /**
   * Envuelve el texto que coincide con la búsqueda en un <mark>.
   * Sólo se activa cuando hay texto de búsqueda activo.
   */
  resaltar(texto: string = ''): string {
    const q = this.textoBusqueda.trim();
    if (!q) return this.escapar(texto);

    const escapado = this.escapar(texto);
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return escapado.replace(regex, '<mark class="search-highlight">$1</mark>');
  }

  /** Escapa caracteres HTML para evitar XSS antes de insertar innerHTML */
  private escapar(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Imagen ────────────────────────────────────────────────────────────────
  onImgError(e: Event): void {
    (e.target as HTMLImageElement).style.display = 'none';
  }

  // ── Cantidad ──────────────────────────────────────────────────────────────
  decrementar(p: Producto): void {
    const v = this.cantidades.get(p.id!) ?? 1;
    if (v > 1) this.cantidades.set(p.id!, v - 1);
  }

  incrementar(p: Producto): void {
    const v = this.cantidades.get(p.id!) ?? 1;
    if (v < p.stock) this.cantidades.set(p.id!, v + 1);
  }

  // ── Agregar al carrito ────────────────────────────────────────────────────
  agregarAlCarrito(p: Producto): void {
    if (p.id == null || p.stock <= 0) return;
    const cantidad = this.cantidades.get(p.id) ?? 1;
    this.cartService.agregar(p, cantidad);

    this.agregadoId = p.id;
    setTimeout(() => {
      if (this.agregadoId === p.id) this.agregadoId = null;
    }, 1500);

    this.cartService.abrirDrawer();
  }

  // ── Eliminar ──────────────────────────────────────────────────────────────
  eliminar(p: Producto): void {
    if (p.id == null || !confirm(`¿Eliminar "${p.nombre}"?`)) return;
    this.eliminandoId = p.id;
    this.productoService.eliminar(p.id).subscribe({
      next: () => {
        this.productos = this.productos.filter(x => x.id !== p.id);
        this.aplicarFiltros(this.textoBusqueda, this.categoriaActiva);
        this.eliminandoId = null;
        this.toastSvc.exito(`"${p.nombre}" eliminado.`);
      },
      error: err => {
        this.eliminandoId = null;
        this.toastSvc.error(this.msgError(err, 'No se pudo eliminar'));
      },
    });
  }

  // ── Modal ─────────────────────────────────────────────────────────────────
  abrirModalCrear(): void {
    this.modoEdicion = false;
    this.editandoId = null;
    this.form = { nombre: '', descripcion: '', precio: undefined, stock: undefined, imagenUrl: '' };
    this.errorModal = '';
    this.modalAbierto = true;
  }

  abrirModalEditar(p: Producto): void {
    this.modoEdicion = true;
    this.editandoId = p.id ?? null;
    this.form = { ...p };
    this.errorModal = '';
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
  }

  guardarProducto(): void {
    if (!this.form.nombre?.trim())                    { this.toastSvc.aviso('El nombre es obligatorio.'); return; }
    if (!this.form.precio || this.form.precio <= 0)   { this.toastSvc.aviso('El precio debe ser mayor a 0.'); return; }
    if (this.form.stock == null || this.form.stock < 0) { this.toastSvc.aviso('El stock no puede ser negativo.'); return; }

    if (this.form.categoria === '__nueva__') {
      if (!this.nuevaCategoria.trim()) { this.toastSvc.aviso('Escribe el nombre de la nueva categoría.'); return; }
      this.form.categoria = this.nuevaCategoria.trim();
    }

    this.guardando = true;

    if (this.modoEdicion && this.editandoId != null) {
      this.productoService.actualizar(this.editandoId, this.form as Producto).subscribe({
        next: actualizado => {
          const idx = this.productos.findIndex(p => p.id === this.editandoId);
          if (idx >= 0) this.productos[idx] = actualizado;
          this.aplicarFiltros(this.textoBusqueda, this.categoriaActiva);
          this.modalAbierto = false;
          this.guardando = false;
          this.toastSvc.exito(`"${actualizado.nombre}" actualizado.`);
        },
        error: err => {
          this.toastSvc.error(this.msgError(err, 'Error al actualizar'));
          this.guardando = false;
        },
      });
    } else {
      this.productoService.crear(this.form as Producto).subscribe({
        next: nuevo => {
          this.productos = [...this.productos, nuevo];
          this.aplicarFiltros(this.textoBusqueda, this.categoriaActiva);
          this.modalAbierto = false;
          this.guardando = false;
          this.toastSvc.exito(`"${nuevo.nombre}" creado.`);
        },
        error: err => {
          this.toastSvc.error(this.msgError(err, 'Error al crear'));
          this.guardando = false;
        },
      });
    }
  }

  private msgError(err: any, base: string): string {
    if (err?.status === 0)   return `${base}: sin respuesta del servidor.`;
    if (err?.status === 401) return `${base}: sesión no autorizada.`;
    if (err?.status === 404) return `${base}: no encontrado.`;
    return `${base} (HTTP ${err?.status ?? '?'}).`;
  }
}
