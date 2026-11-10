import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/toast/toast.service';
import { ProductoService } from '../productos/producto.service';
import { Pedido, PedidoService } from './pedido.service';

const ESTADOS = ['PENDIENTE', 'EN_PROCESO', 'ENTREGADO', 'CANCELADO'] as const;
type Estado = typeof ESTADOS[number];

@Component({
  selector: 'app-pedidos-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- ── Header ─────────────────────────────────────────────────────────── -->
    <div class="toolbar">
      <h2 class="page-title">Gestión de pedidos</h2>
      <button class="btn btn-ghost btn-sm" (click)="cargar()" [disabled]="cargando">
        {{ cargando ? 'Cargando...' : '↺ Actualizar' }}
      </button>
    </div>

    <!-- ── Estadísticas rápidas ───────────────────────────────────────────── -->
    <div class="pa-stats-row" *ngIf="!cargando && pedidosTodos.length > 0">
      <div class="pa-stat-card" *ngFor="let s of stats">
        <div class="pa-stat-num" [style.color]="s.color">{{ s.valor }}</div>
        <div class="pa-stat-label">{{ s.label }}</div>
      </div>
    </div>

    <!-- ── Filtros ────────────────────────────────────────────────────────── -->
    <div class="pa-filtros" *ngIf="!cargando && pedidosTodos.length > 0">

      <!-- Búsqueda por ID o clienteId -->
      <div class="search-input-wrap" style="flex:1;min-width:220px">
        <span class="search-icon">🔍</span>
        <input
          class="search-input"
          type="text"
          [(ngModel)]="filtroBusqueda"
          (ngModelChange)="aplicarFiltros()"
          placeholder="Buscar por # pedido o ID cliente..."
        >
        <button class="search-clear-btn" *ngIf="filtroBusqueda" (click)="filtroBusqueda=''; aplicarFiltros()">✕</button>
      </div>

      <!-- Filtro por estado -->
      <div class="pa-estado-chips">
        <button
          class="pa-chip"
          [class.pa-chip-active]="filtroEstado === null"
          (click)="setFiltroEstado(null)"
        >Todos <span class="pa-chip-num">{{ pedidosTodos.length }}</span></button>
        <button
          class="pa-chip"
          *ngFor="let e of estados"
          [class.pa-chip-active]="filtroEstado === e"
          [class]="'pa-chip pa-chip-' + e.toLowerCase() + (filtroEstado === e ? ' pa-chip-active' : '')"
          (click)="setFiltroEstado(e)"
        >{{ e }} <span class="pa-chip-num">{{ contarEstado(e) }}</span></button>
      </div>

    </div>

    <!-- ── Skeleton ───────────────────────────────────────────────────────── -->
    <div *ngIf="cargando">
      <!-- Stats placeholder -->
      <div class="pa-stats-row" style="margin-bottom:20px">
        <div class="rabbit-card" *ngFor="let i of [1,2,3,4,5,6]" style="min-width:110px;gap:8px;display:flex;flex-direction:column">
          <div class="skeleton skeleton-row w60" style="height:28px;border-radius:6px"></div>
          <div class="skeleton skeleton-row w80" style="height:12px;border-radius:4px"></div>
        </div>
      </div>
      <!-- Filas placeholder -->
      <div class="skeleton-order" *ngFor="let i of [1,2,3,4,5]">
        <div class="skeleton skeleton-order-head"></div>
        <div class="skeleton-order-body">
          <div class="skeleton skeleton-row w100"></div>
          <div class="skeleton skeleton-row w60"></div>
        </div>
      </div>
    </div>

    <!-- ── Sin resultados ─────────────────────────────────────────────────── -->
    <div class="empty-state" *ngIf="!cargando && pedidosFiltrados.length === 0 && pedidosTodos.length > 0">
      <div class="empty-icon">📦</div>
      <p>Sin pedidos que coincidan con los filtros.</p>
      <button class="btn btn-ghost btn-sm" (click)="limpiarFiltros()">Limpiar filtros</button>
    </div>

    <div class="empty-state" *ngIf="!cargando && pedidosTodos.length === 0">
      <div class="empty-icon">📦</div>
      <p>Aún no hay pedidos en el sistema.</p>
    </div>

    <!-- ── Tabla de pedidos ───────────────────────────────────────────────── -->
    <div class="pa-table-wrap" *ngIf="!cargando && pedidosFiltrados.length > 0">
      <table class="pa-table">
        <thead>
          <tr>
            <th class="pa-th-sort" (click)="ordenarPor('id')"># Pedido
              <span class="pa-sort-icon">{{ ordenCol === 'id' ? (ordenAsc ? '↑' : '↓') : '↕' }}</span>
            </th>
            <th>Cliente</th>
            <th class="pa-th-sort" (click)="ordenarPor('fecha')">Fecha
              <span class="pa-sort-icon">{{ ordenCol === 'fecha' ? (ordenAsc ? '↑' : '↓') : '↕' }}</span>
            </th>
            <th>Ítems</th>
            <th class="pa-th-sort" (click)="ordenarPor('total')">Total
              <span class="pa-sort-icon">{{ ordenCol === 'total' ? (ordenAsc ? '↑' : '↓') : '↕' }}</span>
            </th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          <ng-container *ngFor="let p of pedidosFiltrados">
            <!-- Fila principal -->
            <tr class="pa-row" [class.pa-row-expanded]="expandidoId === p.id" (click)="toggleExpandir(p.id!)">
              <td class="pa-td-id">#{{ p.id }}</td>
              <td class="pa-td-cliente">
                <span class="pa-cliente-id" [title]="p.clienteId">{{ acortarId(p.clienteId) }}</span>
              </td>
              <td class="pa-td-fecha">{{ p.fecha | date:'dd/MM/yy HH:mm' }}</td>
              <td class="pa-td-items">{{ p.items.length }} ítem{{ p.items.length !== 1 ? 's' : '' }}</td>
              <td class="pa-td-total">{{ total(p) | currency:'CLP':'symbol-narrow':'1.0-0' }}</td>
              <td class="pa-td-estado" (click)="$event.stopPropagation()">
                <span [class]="badgeClase(p.estado)">{{ p.estado }}</span>
              </td>
              <td class="pa-td-accion" (click)="$event.stopPropagation()">
                <select
                  class="pa-estado-select"
                  [value]="p.estado"
                  (change)="cambiarEstado(p, $any($event.target).value)"
                  [disabled]="actualizandoId === p.id"
                  [title]="'Cambiar estado de #' + p.id"
                >
                  <option *ngFor="let e of estados" [value]="e">{{ e }}</option>
                </select>
                <span class="pa-spinner-inline" *ngIf="actualizandoId === p.id">⏳</span>
              </td>
            </tr>

            <!-- Fila detalle expandible -->
            <tr class="pa-row-detail" *ngIf="expandidoId === p.id">
              <td colspan="7">
                <div class="pa-detail-inner">
                  <div class="pa-detail-meta">
                    <div class="pa-detail-meta-item">
                      <span class="pa-detail-label">Cliente ID completo</span>
                      <span class="pa-detail-val pa-cliente-full">{{ p.clienteId }}</span>
                    </div>
                    <div class="pa-detail-meta-item">
                      <span class="pa-detail-label">Fecha</span>
                      <span class="pa-detail-val">{{ p.fecha | date:'dd/MM/yyyy HH:mm:ss' }}</span>
                    </div>
                    <div class="pa-detail-meta-item">
                      <span class="pa-detail-label">Total</span>
                      <span class="pa-detail-val" style="color:var(--cyan)">
                        {{ total(p) | currency:'CLP':'symbol-narrow':'1.0-0' }}
                      </span>
                    </div>
                  </div>

                  <table class="pa-items-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Cant.</th>
                        <th>Precio unit.</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let item of p.items">
                        <td>{{ nombreProducto(item.productoId) }}</td>
                        <td>{{ item.cantidad }}</td>
                        <td>{{ item.precioUnitario ?? 0 | currency:'CLP':'symbol-narrow':'1.0-0' }}</td>
                        <td>{{ (item.precioUnitario ?? 0) * item.cantidad | currency:'CLP':'symbol-narrow':'1.0-0' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          </ng-container>
        </tbody>
      </table>
    </div>

    <!-- ── Contador de resultados ─────────────────────────────────────────── -->
    <div class="pa-resultados" *ngIf="!cargando && pedidosFiltrados.length > 0">
      Mostrando {{ pedidosFiltrados.length }} de {{ pedidosTodos.length }} pedidos
    </div>
  `,
})
export class PedidosAdminComponent implements OnInit {
  pedidosTodos: Pedido[]      = [];
  pedidosFiltrados: Pedido[]  = [];

  cargando       = true;
  actualizandoId: number | null = null;
  expandidoId:    number | null = null;

  filtroBusqueda = '';
  filtroEstado: string | null = null;
  ordenCol: 'id' | 'fecha' | 'total' = 'id';
  ordenAsc = false;

  readonly estados = ESTADOS;
  private nombres  = new Map<number, string>();

  constructor(
    private pedidoService:  PedidoService,
    private productoService: ProductoService,
    private toastSvc: ToastService,
  ) {}

  ngOnInit(): void {
    this.productoService.listar().subscribe({
      next: ps => ps.forEach(p => p.id != null && this.nombres.set(p.id, p.nombre)),
    });
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.pedidoService.listarTodos().subscribe({
      next: data => {
        this.pedidosTodos = data;
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: err => {
        this.toastSvc.error(`No se pudieron cargar los pedidos (HTTP ${err?.status ?? '?'}).`);
        this.cargando = false;
      },
    });
  }

  // ── Estadísticas ──────────────────────────────────────────────────────────
  get stats() {
    const todos   = this.pedidosTodos;
    const ingresos = todos.reduce((s, p) => s + this.total(p), 0);
    return [
      { label: 'Total pedidos', valor: todos.length,                                  color: 'var(--text)' },
      { label: 'Pendientes',    valor: this.contarEstado('PENDIENTE'),                 color: 'var(--yellow)' },
      { label: 'En proceso',    valor: this.contarEstado('EN_PROCESO'),                color: 'var(--cyan)' },
      { label: 'Entregados',    valor: this.contarEstado('ENTREGADO'),                 color: 'var(--green)' },
      { label: 'Cancelados',    valor: this.contarEstado('CANCELADO'),                 color: 'var(--red)' },
      { label: 'Ingresos',      valor: ingresos.toLocaleString('es-CL', { style:'currency', currency:'CLP', maximumFractionDigits:0 }), color: 'var(--cyan)' },
    ];
  }

  contarEstado(e: string): number {
    return this.pedidosTodos.filter(p => p.estado === e).length;
  }

  // ── Filtros + orden ───────────────────────────────────────────────────────
  setFiltroEstado(e: string | null): void {
    this.filtroEstado = e;
    this.aplicarFiltros();
  }

  limpiarFiltros(): void {
    this.filtroBusqueda = '';
    this.filtroEstado   = null;
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    let lista = [...this.pedidosTodos];

    // Filtro por estado
    if (this.filtroEstado) {
      lista = lista.filter(p => p.estado === this.filtroEstado);
    }

    // Búsqueda por ID o clienteId
    const q = this.filtroBusqueda.trim().toLowerCase();
    if (q) {
      lista = lista.filter(p =>
        String(p.id).includes(q) ||
        p.clienteId.toLowerCase().includes(q)
      );
    }

    // Ordenación
    lista = this.ordenar(lista);
    this.pedidosFiltrados = lista;
  }

  ordenarPor(col: 'id' | 'fecha' | 'total'): void {
    if (this.ordenCol === col) {
      this.ordenAsc = !this.ordenAsc;
    } else {
      this.ordenCol = col;
      this.ordenAsc = col !== 'id'; // id desc por defecto, fecha/total asc
    }
    this.aplicarFiltros();
  }

  private ordenar(lista: Pedido[]): Pedido[] {
    return [...lista].sort((a, b) => {
      let diff = 0;
      switch (this.ordenCol) {
        case 'id':    diff = (a.id ?? 0) - (b.id ?? 0);          break;
        case 'fecha': diff = (a.fecha ?? '').localeCompare(b.fecha ?? ''); break;
        case 'total': diff = this.total(a) - this.total(b);        break;
      }
      return this.ordenAsc ? diff : -diff;
    });
  }

  // ── Cambio de estado ──────────────────────────────────────────────────────
  cambiarEstado(pedido: Pedido, nuevoEstado: string): void {
    if (nuevoEstado === pedido.estado || !pedido.id) return;
    const estadoAnterior = pedido.estado;
    this.actualizandoId  = pedido.id;

    this.pedidoService.actualizarEstado(pedido.id, nuevoEstado).subscribe({
      next: actualizado => {
        pedido.estado       = actualizado.estado;
        this.actualizandoId = null;
        this.aplicarFiltros();
        this.toastSvc.exito(`Pedido #${pedido.id}: ${estadoAnterior} → ${nuevoEstado}`);
      },
      error: err => {
        this.actualizandoId = null;
        this.toastSvc.error(
          err?.status === 404
            ? `Pedido #${pedido.id} no encontrado.`
            : `No se pudo actualizar #${pedido.id} (HTTP ${err?.status ?? '?'}).`
        );
      },
    });
  }

  // ── Expandir fila ─────────────────────────────────────────────────────────
  toggleExpandir(id: number): void {
    this.expandidoId = this.expandidoId === id ? null : id;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  total(p: Pedido): number {
    return p.items.reduce((s, i) => s + (i.precioUnitario ?? 0) * i.cantidad, 0);
  }

  nombreProducto(id: number): string {
    return this.nombres.get(id) ?? `Producto #${id}`;
  }

  acortarId(id: string): string {
    return id.length > 12 ? id.slice(0, 8) + '…' : id;
  }

  badgeClase(estado?: string): string {
    const map: Record<string, string> = {
      PENDIENTE:  'badge badge-pendiente',
      EN_PROCESO: 'badge badge-en_proceso',
      ENTREGADO:  'badge badge-entregado',
      CANCELADO:  'badge badge-cancelado',
    };
    return map[estado ?? ''] ?? 'badge';
  }
}
