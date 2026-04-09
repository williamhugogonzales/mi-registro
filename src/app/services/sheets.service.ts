import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Persona, PersonaConAccion } from '../models/persona.model';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SheetsService {
  private url = environment.googleScriptUrl;

  constructor(private http: HttpClient) {}

  guardar(persona: Persona, accion: 'CREATE' | 'UPDATE' = 'CREATE'): Observable<any> {
    const data = [persona.id, persona.nombre, persona.edad, persona.nacionalidad, persona.sexo, persona.fechaRegistro, accion];
    console.log('APK - Enviando array a Google Sheets:', data);
    console.log('APK - URL destino:', this.url);
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(this.url, data, { headers }).pipe(
      tap(response => {
        console.log('APK - Respuesta exitosa del servidor:', response);
      }),
      catchError(error => {
        console.error('APK - Error en petición HTTP:', error);
        console.error('APK - Status code:', error.status);
        console.error('APK - Status text:', error.statusText);
        if (error.error) {
          console.error('APK - Error body:', error.error);
        }
        throw error;
      })
    );
  }

  eliminarHttp(id: string): Observable<any> {
    const data = ['DELETE', id];
    console.log('APK - Enviando eliminación array:', data);
    console.log('APK - URL destino:', this.url);
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(this.url, data, { headers }).pipe(
      tap(response => {
        console.log('APK - Respuesta eliminación exitosa:', response);
      }),
      catchError(error => {
        console.error('APK - Error en eliminación HTTP:', error);
        console.error('APK - Status code:', error.status);
        console.error('APK - Status text:', error.statusText);
        if (error.error) {
          console.error('APK - Error body:', error.error);
        }
        throw error;
      })
    );
  }

  obtenerTodos(): Observable<Persona[]> {
    return this.http.get<Persona[]>(`${this.url}?t=${Date.now()}`);
  }

  async guardarFetch(persona: Persona, accion: 'CREATE' | 'UPDATE' = 'CREATE'): Promise<any> {
    const data = [persona.id, persona.nombre, persona.edad, persona.nacionalidad, persona.sexo, persona.fechaRegistro, accion];
    console.log('WEB - Enviando array a Google Sheets:', data);
    console.log('WEB - Persona completa:', persona);
    console.log('WEB - Acción:', accion);
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
    console.log('WEB - Enviando eliminación fetch con body:', JSON.stringify(data));
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