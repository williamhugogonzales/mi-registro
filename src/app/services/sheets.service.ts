import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Persona } from '../models/persona.model';
import { Observable } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { CapacitorHttp } from '@capacitor/core';

@Injectable({ providedIn: 'root' })
export class SheetsService {
  private url = environment.googleScriptUrl;

  constructor(private http: HttpClient) {}

  // ─── LECTURA ──────────────────────────────────────────────────────────────
  obtenerTodos(): Observable<Persona[]> {
    return this.http.get<Persona[]>(`${this.url}?t=${Date.now()}`);
  }

  // ─── GUARDAR (CREATE / UPDATE) ────────────────────────────────────────────
  async guardar(persona: Persona, accion: 'CREATE' | 'UPDATE' = 'CREATE'): Promise<void> {
    const data = [
      persona.id,
      persona.nombre,
      persona.edad,
      persona.nacionalidad,
      persona.sexo,
      persona.fechaRegistro,
      accion
    ];
    console.log(`[SheetsService] ${accion} - Plataforma:`, Capacitor.getPlatform());
    console.log(`[SheetsService] ${accion} - Datos:`, data);

    if (Capacitor.isNativePlatform()) {
      await this.enviarConCapacitorHttp(data);
    } else {
      await this.enviarConFetch(data);
    }
  }

  // ─── ELIMINAR ─────────────────────────────────────────────────────────────
  async eliminar(id: string): Promise<void> {
    const data = ['DELETE', id];
    console.log('[SheetsService] DELETE - Plataforma:', Capacitor.getPlatform());
    console.log('[SheetsService] DELETE - Datos:', data);

    if (Capacitor.isNativePlatform()) {
      await this.enviarConCapacitorHttp(data);
    } else {
      await this.enviarConFetch(data);
    }
  }

  // ─── Web: fetch con no-cors ───────────────────────────────────────────────
  private async enviarConFetch(data: any[]): Promise<void> {
    console.log('[SheetsService] Usando fetch (web)');
    await fetch(this.url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(data)
    });
    console.log('[SheetsService] fetch enviado correctamente');
  }

  // ─── Android/iOS: CapacitorHttp nativo (incluido en @capacitor/core) ──────
  private async enviarConCapacitorHttp(data: any[]): Promise<void> {
    console.log('[SheetsService] Usando CapacitorHttp nativo');
    const response = await CapacitorHttp.post({
      url: this.url,
      headers: { 'Content-Type': 'text/plain' },
      data: JSON.stringify(data)
    });
    console.log('[SheetsService] Respuesta CapacitorHttp:', response.status, response.data);
  }
}
