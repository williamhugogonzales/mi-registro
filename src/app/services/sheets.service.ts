import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Mascota } from '../models/mascota.model';
import { Salud } from '../models/salud.model';
import { Vacuna } from '../models/vacuna.model';
import { Desparasitacion } from '../models/desparasitacion.model';
import { Comida } from '../models/comida.model';
import { Excrecion } from '../models/excrecion.model';
import { Observable } from 'rxjs';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

@Injectable({ providedIn: 'root' })
export class SheetsService {
  private url = environment.googleScriptUrl;

  constructor(private http: HttpClient) {}

  // ─── LECTURA ──────────────────────────────────────────────────────────────
  obtenerMascotas(): Observable<Mascota[]> {
    return this.http.get<Mascota[]>(`${this.url}?hoja=Mascotas&t=${Date.now()}`);
  }
  obtenerSalud(): Observable<Salud[]> {
    return this.http.get<Salud[]>(`${this.url}?hoja=Salud&t=${Date.now()}`);
  }
  obtenerVacunas(): Observable<Vacuna[]> {
    return this.http.get<Vacuna[]>(`${this.url}?hoja=Vacunas&t=${Date.now()}`);
  }
  obtenerDesparasitaciones(): Observable<Desparasitacion[]> {
    return this.http.get<Desparasitacion[]>(`${this.url}?hoja=Desparasitaciones&t=${Date.now()}`);
  }
  obtenerComidas(): Observable<Comida[]> {
    return this.http.get<Comida[]>(`${this.url}?hoja=Comidas&t=${Date.now()}`);
  }
  obtenerExcreciones(): Observable<Excrecion[]> {
    return this.http.get<Excrecion[]>(`${this.url}?hoja=Excreciones&t=${Date.now()}`);
  }

  // ─── GUARDAR ──────────────────────────────────────────────────────────────
  async guardarMascota(m: Mascota, accion: 'CREATE' | 'UPDATE' = 'CREATE'): Promise<void> {
    await this.enviar([m.id, m.nombre, m.especie, m.raza, m.fecha_nacimiento,
      m.sexo, m.propietario, m.fechaRegistro, accion, 'Mascotas'], accion);
  }
  async guardarSalud(s: Salud, accion: 'CREATE' | 'UPDATE' = 'CREATE'): Promise<void> {
    await this.enviar([s.id_salud, s.id_persona, s.peso, s.talla,
      s.enfermedades, s.fechaRegistro, accion, 'Salud'], accion);
  }
  async guardarVacuna(v: Vacuna, accion: 'CREATE' | 'UPDATE' = 'CREATE'): Promise<void> {
    await this.enviar([v.id_vacuna, v.id_persona, v.tipo_vacuna,
      v.fecha_aplicacion, v.proxima_dosis, v.observaciones,
      v.peso, v.fechaRegistro, accion, 'Vacunas'], accion);
  }
  async guardarDesparasitacion(d: Desparasitacion, accion: 'CREATE' | 'UPDATE' = 'CREATE'): Promise<void> {
    await this.enviar([d.id_desparasitacion, d.id_persona, d.nombre_desparasitante,
      d.fecha_aplicacion, d.proxima_dosis, d.observaciones,
      d.peso, d.fechaRegistro, accion, 'Desparasitaciones'], accion);
  }
  async guardarComida(c: Comida, accion: 'CREATE' | 'UPDATE' = 'CREATE'): Promise<void> {
    await this.enviar([c.id_comida, c.id_persona, c.tipo_comida,
      c.cantidad, c.hora, c.observaciones,
      c.fechaRegistro, accion, 'Comidas'], accion);
  }
  async guardarExcrecion(e: Excrecion, accion: 'CREATE' | 'UPDATE' = 'CREATE'): Promise<void> {
    await this.enviar([e.id_excrecion, e.id_persona, e.tipo,
      e.cantidad, e.consistencia, e.color,
      e.hora, e.observaciones, e.fechaRegistro,
      accion, 'Excreciones'], accion);
  }

  // ─── ELIMINAR ─────────────────────────────────────────────────────────────
  async eliminarMascota(id: string): Promise<void> { await this.enviar(['DELETE', id, 'Mascotas'], 'DELETE'); }
  async eliminarSalud(id: string): Promise<void> { await this.enviar(['DELETE', id, 'Salud'], 'DELETE'); }
  async eliminarVacuna(id: string): Promise<void> { await this.enviar(['DELETE', id, 'Vacunas'], 'DELETE'); }
  async eliminarDesparasitacion(id: string): Promise<void> { await this.enviar(['DELETE', id, 'Desparasitaciones'], 'DELETE'); }
  async eliminarComida(id: string): Promise<void> { await this.enviar(['DELETE', id, 'Comidas'], 'DELETE'); }
  async eliminarExcrecion(id: string): Promise<void> { await this.enviar(['DELETE', id, 'Excreciones'], 'DELETE'); }

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
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' }, body
      });
    }
  }
}
