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
    const data = [persona.id, persona.nombre, persona.edad, persona.nacionalidad, persona.sexo, persona.fechaRegistro, accion];
    return this.http.post(this.url, data, { headers });
  }

  eliminarHttp(id: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const data = ['DELETE', id];
    return this.http.post(this.url, data, { headers });
  }

  obtenerTodos(): Observable<Persona[]> {
    return this.http.get<Persona[]>(`${this.url}?t=${Date.now()}`);
  }

  async guardarFetch(persona: Persona, accion: 'CREATE' | 'UPDATE' = 'CREATE'): Promise<any> {
    const data = [persona.id, persona.nombre, persona.edad, persona.nacionalidad, persona.sexo, persona.fechaRegistro, accion];
    const response = await fetch(this.url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(data)
    });
    return response;
  }

  async eliminar(id: string): Promise<any> {
    const data = ['DELETE', id];
    console.log('Enviando eliminación fetch con body:', JSON.stringify(data));
    const response = await fetch(this.url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(data)
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