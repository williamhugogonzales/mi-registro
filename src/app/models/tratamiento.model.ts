export interface Tratamiento {
  id_tratamiento: string;
  id_persona:     string;
  nombre:         string;
  tipo:           string;
  diagnostico:    string;
  dosis:          string;
  veces_por_dia:  number;
  hora:           string;
  fecha_inicio:   string;
  fecha_fin:      string;
  observaciones:  string;
  fechaRegistro:  string;
}
