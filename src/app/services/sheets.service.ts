import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Persona, PersonaConAccion } from '../models/persona.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SheetsService {
  private url = environment.googleScriptUrl;

  constructor(private http: HttpClient) {}

  guardar(persona: Persona, accion: 'CREATE' | 'UPDATE' = 'CREATE'): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const personaConAccion: PersonaConAccion = { ...persona, accion };
    return this.http.post(this.url, personaConAccion, { headers });
  }

  eliminarHttp(id: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = { accion: 'DELETE', id };
    return this.http.post(this.url, body, { headers });
  }

  obtenerTodos(): Observable<Persona[]> {
    return this.http.get<Persona[]>(`${this.url}?t=${Date.now()}`);
  }

  async guardarFetch(persona: Persona, accion: 'CREATE' | 'UPDATE' = 'CREATE'): Promise<any> {
    const personaConAccion: PersonaConAccion = { ...persona, accion };
    const response = await fetch(this.url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(personaConAccion)
    });
    return response;
  }

  async eliminar(id: string): Promise<any> {
    const body = JSON.stringify({ accion: 'DELETE', id });
    console.log('Enviando eliminación fetch con body:', body);
    const response = await fetch(this.url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body
    });
    console.log('Respuesta de eliminación fetch:', response);
    if (response.type === 'opaque') {
      return response;
    }
    if (!response.ok) {
      throw new Error(`Error al eliminar: ${response.status}`);
    }
    return response.json().catch(() => response);
  }

}