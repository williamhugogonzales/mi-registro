import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Mascota } from '../models/mascota.model';
import { Salud } from '../models/salud.model';
import { Vacuna } from '../models/vacuna.model';
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

  // ─── GUARDAR MASCOTA ──────────────────────────────────────────────────────
  async guardarMascota(mascota: Mascota, accion: 'CREATE' | 'UPDATE' = 'CREATE'): Promise<void> {
    const data = [
      mascota.id, mascota.nombre, mascota.especie, mascota.raza,
      mascota.fecha_nacimiento, mascota.sexo, mascota.propietario,
      mascota.fechaRegistro, accion, 'Mascotas'
    ];
    await this.enviar(data, accion);
  }

  // ─── GUARDAR SALUD ────────────────────────────────────────────────────────
  async guardarSalud(salud: Salud, accion: 'CREATE' | 'UPDATE' = 'CREATE'): Promise<void> {
    const data = [
      salud.id_salud, salud.id_persona, salud.peso,
      salud.talla, salud.enfermedades, salud.fechaRegistro,
      accion, 'Salud'
    ];
    await this.enviar(data, accion);
  }

  // ─── GUARDAR VACUNA ───────────────────────────────────────────────────────
  async guardarVacuna(vacuna: Vacuna, accion: 'CREATE' | 'UPDATE' = 'CREATE'): Promise<void> {
    const data = [
      vacuna.id_vacuna, vacuna.id_persona, vacuna.tipo_vacuna,
      vacuna.fecha_aplicacion, vacuna.proxima_dosis,
      vacuna.observaciones, vacuna.peso, vacuna.fechaRegistro,
      accion, 'Vacunas'
    ];
    await this.enviar(data, accion);
  }

  // ─── ELIMINAR ─────────────────────────────────────────────────────────────
  async eliminarMascota(id: string): Promise<void> {
    await this.enviar(['DELETE', id, 'Mascotas'], 'DELETE');
  }

  async eliminarSalud(id_salud: string): Promise<void> {
    await this.enviar(['DELETE', id_salud, 'Salud'], 'DELETE');
  }

  async eliminarVacuna(id_vacuna: string): Promise<void> {
    await this.enviar(['DELETE', id_vacuna, 'Vacunas'], 'DELETE');
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
