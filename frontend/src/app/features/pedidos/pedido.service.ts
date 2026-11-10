import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DetallePedido {
  productoId: number;
  cantidad: number;
  precioUnitario?: number;
}

export interface Pedido {
  id?: number;
  clienteId: string;
  clienteEmail?: string;
  fecha?: string;
  estado?: string;
  items: DetallePedido[];
}

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private baseUrl = `${environment.pedidosBaseUrl}/api/pedidos`;

  constructor(private http: HttpClient) {}

  listarPorCliente(clienteId: string): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(this.baseUrl, { params: { clienteId } });
  }

  listarTodos(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.baseUrl}/todos`);
  }

  crear(pedido: Pedido): Observable<Pedido> {
    return this.http.post<Pedido>(this.baseUrl, pedido);
  }

  actualizarEstado(id: number, estado: string): Observable<Pedido> {
    return this.http.patch<Pedido>(`${this.baseUrl}/${id}/estado`, { estado });
  }
}
