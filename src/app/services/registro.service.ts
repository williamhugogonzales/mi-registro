import { Injectable } from '@angular/core';
import { Persona } from '../models/persona.model';

@Injectable({ providedIn: 'root' })
export class RegistroService {
  private readonly KEY = 'personas';

  obtenerTodos(): Persona[] {
    const datos = localStorage.getItem(this.KEY);
    return datos ? JSON.parse(datos) : [];
  }

  guardar(persona: Persona): void {
    const lista = this.obtenerTodos();
    lista.push(persona);
    localStorage.setItem(this.KEY, JSON.stringify(lista));
  }

  eliminar(id: string): void {
    const lista = this.obtenerTodos().filter(p => p.id !== id);
    localStorage.setItem(this.KEY, JSON.stringify(lista));
  }
}