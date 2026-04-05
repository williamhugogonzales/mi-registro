import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Persona } from '../models/persona.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SheetsService {
  private url = environment.googleScriptUrl;

  constructor(private http: HttpClient) {}

  async guardarFetch(persona: Persona): Promise<any> {
  const response = await fetch(this.url, {
    method: 'POST',
    mode: 'no-cors',   // 👈 esto evita el error CORS
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(persona)
  });
  return response; // con no-cors no puedes leer la respuesta, pero sí guarda
}

  obtenerTodos(): Observable<Persona[]> {
    return this.http.get<Persona[]>(this.url);
  }
}