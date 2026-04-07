export interface Persona {
  id: string;
  nombre: string;
  edad: number;
  nacionalidad: string;
  sexo: string;
  fechaRegistro: string;
}

export interface PersonaConAccion extends Persona {
  accion: 'CREATE' | 'UPDATE';
}