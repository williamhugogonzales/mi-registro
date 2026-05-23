import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Persona } from '../models/persona.model';
import { Salud } from '../models/salud.model';
import { Observable } from 'rxjs';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

@Injectable({ providedIn: 'root' })
export class SheetsService {
  private url = environment.googleScriptUrl;

  constructor(private http: HttpClient) {}

  // ─── LECTURA ──────────────────────────────────────────────────────────────
  obtenerPersonas(): Observable<Persona[]> {
    return this.http.get<Persona[]>(`${this.url}?hoja=Personas&t=${Date.now()}`);
  }

  obtenerSalud(): Observable<Salud[]> {
    return this.http.get<Salud[]>(`${this.url}?hoja=Salud&t=${Date.now()}`);
  }

  // ─── GUARDAR PERSONA ──────────────────────────────────────────────────────
  async guardarPersona(persona: Persona, accion: 'CREATE' | 'UPDATE' = 'CREATE'): Promise<void> {
    const data = [
      persona.id,
      persona.nombre,
      persona.edad,
      persona.nacionalidad,
      persona.sexo,
      persona.fechaRegistro,
      accion,
      'Personas'
    ];
    console.log(`[SheetsService] Persona ${accion}:`, data);
    await this.enviar(data, accion);
  }

  // ─── GUARDAR SALUD ────────────────────────────────────────────────────────
  async guardarSalud(salud: Salud, accion: 'CREATE' | 'UPDATE' = 'CREATE'): Promise<void> {
    const data = [
      salud.id_salud,
      salud.id_persona,
      salud.peso,
      salud.talla,
      salud.enfermedades,
      salud.fechaRegistro,
      accion,
      'Salud'
    ];
    console.log(`[SheetsService] Salud ${accion}:`, data);
    await this.enviar(data, accion);
  }

  // ─── ELIMINAR ─────────────────────────────────────────────────────────────
  async eliminarPersona(id: string): Promise<void> {
    await this.enviar(['DELETE', id, 'Personas'], 'DELETE');
  }

  async eliminarSalud(id_salud: string): Promise<void> {
    await this.enviar(['DELETE', id_salud, 'Salud'], 'DELETE');
  }

  // ─── ENVÍO UNIFICADO ──────────────────────────────────────────────────────
  private async enviar(data: any[], operacion: string): Promise<void> {
    const body = JSON.stringify(data);
    const esNativo = Capacitor.isNativePlatform();
    console.log(`[SheetsService] ${operacion} | Nativo: ${esNativo} | Body: ${body}`);

    if (esNativo) {
      const response = await CapacitorHttp.post({
        url: this.url,
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        data: body,
        webFetchExtra: { redirect: 'follow' }
      });
      console.log(`[SheetsService] Respuesta: ${response.status}`, response.data);
    } else {
      await fetch(this.url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body
      });
      console.log(`[SheetsService] fetch web enviado`);
    }
  }
}
