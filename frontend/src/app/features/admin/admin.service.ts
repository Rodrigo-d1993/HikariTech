import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface QueueInfo {
  name: string;
  messages: number;
  messages_ready: number;
  messages_unacknowledged: number;
  consumers: number;
  state: string;
  durable: boolean;
}

export interface ExchangeInfo {
  name: string;
  type: string;
  durable: boolean;
  auto_delete: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private base = `${environment.adminBaseUrl}/admin`;

  constructor(private http: HttpClient) {}

  listarColas(): Observable<QueueInfo[]> {
    return this.http.get<QueueInfo[]>(`${this.base}/queues`);
  }

  listarExchanges(): Observable<ExchangeInfo[]> {
    return this.http.get<ExchangeInfo[]>(`${this.base}/exchanges`);
  }

  eliminarCola(nombre: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/queues/${encodeURIComponent(nombre)}`);
  }
}
