import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Persona } from '../models/persona.model';
import { Observable } from 'rxjs';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

@Injectable({ providedIn: 'root' })
export class SheetsService {
  private url = environment.googleScriptUrl;

  constructor(private http: HttpClient) {}

  // ─── LECTURA ──────────────────────────────────────────────────────────────
  obtenerTodos(): Observable<Persona[]> {
    return this.http.get<Persona[]>(`${this.url}?t=${Date.now()}`);
  }

  // ─── GUARDAR ─────────────────────────────────────────────────────────────
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
    await this.enviar(data, accion);
  }

  // ─── ELIMINAR ────────────────────────────────────────────────────────────
  async eliminar(id: string): Promise<void> {
    const data = ['DELETE', id];
    await this.enviar(data, 'DELETE');
  }

  // ─── ENVÍO CON 3 INTENTOS ────────────────────────────────────────────────
  private async enviar(data: any[], operacion: string): Promise<void> {
    const plataforma = Capacitor.getPlatform();
    const esNativo = Capacitor.isNativePlatform();
    const body = JSON.stringify(data);

    console.log(`[Sheets] ====== INICIO ${operacion} ======`);
    console.log(`[Sheets] Plataforma: ${plataforma} | Nativo: ${esNativo}`);
    console.log(`[Sheets] URL: ${this.url}`);
    console.log(`[Sheets] Body: ${body}`);

    // MÉTODO 1: CapacitorHttp (nativo, solo en APK)
    if (esNativo) {
      try {
        console.log('[Sheets] Intentando MÉTODO 1: CapacitorHttp...');
        const response = await CapacitorHttp.post({
          url: this.url,
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          data: body,
          webFetchExtra: { redirect: 'follow' }
        });
        console.log('[Sheets] MÉTODO 1 OK - Status:', response.status);
        console.log('[Sheets] MÉTODO 1 OK - Data:', JSON.stringify(response.data));
        return;
      } catch (e: any) {
        console.error('[Sheets] MÉTODO 1 FALLÓ:', e?.message || e);
      }

      // MÉTODO 2: fetch nativo en Android con redirect follow
      try {
        console.log('[Sheets] Intentando MÉTODO 2: fetch con redirect follow...');
        const response = await fetch(this.url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          body: body,
          redirect: 'follow'
        });
        console.log('[Sheets] MÉTODO 2 OK - Status:', response.status, response.type);
        return;
      } catch (e: any) {
        console.error('[Sheets] MÉTODO 2 FALLÓ:', e?.message || e);
      }

      // MÉTODO 3: fetch con no-cors como último recurso
      try {
        console.log('[Sheets] Intentando MÉTODO 3: fetch no-cors...');
        await fetch(this.url, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: body
        });
        console.log('[Sheets] MÉTODO 3 enviado (respuesta opaca)');
        return;
      } catch (e: any) {
        console.error('[Sheets] MÉTODO 3 FALLÓ:', e?.message || e);
        throw new Error('Todos los métodos fallaron en Android');
      }

    } else {
      // WEB: fetch con no-cors
      try {
        console.log('[Sheets] Intentando fetch (web)...');
        await fetch(this.url, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: body
        });
        console.log('[Sheets] fetch web enviado correctamente');
      } catch (e: any) {
        console.error('[Sheets] fetch web FALLÓ:', e?.message || e);
        throw e;
      }
    }
  }
}
 