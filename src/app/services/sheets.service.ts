import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Persona } from '../models/persona.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SheetsService {
  private url = environment.googleScriptUrl;

  constructor(private http: HttpClient) {}

  // ─── LECTURA: GET no tiene problemas de CORS ──────────────────────────────
  obtenerTodos(): Observable<Persona[]> {
    return this.http.get<Persona[]>(`${this.url}?t=${Date.now()}`);
  }

  // ─── GUARDAR (CREATE / UPDATE) ────────────────────────────────────────────
  // Usa fetch con no-cors y text/plain: funciona igual en web y en APK/Android
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
    console.log(`[SheetsService] ${accion} - Enviando datos:`, data);

    await fetch(this.url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(data)
    });

    console.log(`[SheetsService] ${accion} - Petición enviada correctamente`);
  }

  // ─── ELIMINAR ─────────────────────────────────────────────────────────────
  async eliminar(id: string): Promise<void> {
    const data = ['DELETE', id];
    console.log('[SheetsService] DELETE - Enviando datos:', data);

    await fetch(this.url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(data)
    });

    console.log('[SheetsService] DELETE - Petición enviada correctamente');
  }
}
