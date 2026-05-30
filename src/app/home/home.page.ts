import { Component, OnInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
  IonButton, IonIcon, IonList, IonListHeader, IonNote, IonButtons,
  ToastController, LoadingController, AlertController, IonModal, IonFab, IonFabButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  saveOutline, refreshOutline, trashOutline, pawOutline,
  createOutline, closeOutline, addOutline, heartOutline,
  medkitOutline, addCircleOutline, shieldCheckmarkOutline,
  nutritionOutline, restaurantOutline, timeOutline, flaskOutline
} from 'ionicons/icons';
import { SheetsService } from '../services/sheets.service';
import { Mascota } from '../models/mascota.model';
import { Salud } from '../models/salud.model';
import { Vacuna } from '../models/vacuna.model';
import { Desparasitacion } from '../models/desparasitacion.model';
import { Comida } from '../models/comida.model';
import { Excrecion } from '../models/excrecion.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
    IonButton, IonIcon, IonList, IonListHeader, IonNote, IonButtons,
    IonModal, IonFab, IonFabButton
  ],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePage implements OnInit {
  @ViewChild('modalMascota')  modalMascota:  IonModal | null = null;
  @ViewChild('modalSalud')    modalSalud:    IonModal | null = null;
  @ViewChild('modalVacunas')  modalVacunas:  IonModal | null = null;
  @ViewChild('modalVacuna')   modalVacuna:   IonModal | null = null;
  @ViewChild('modalDesparas') modalDesparas: IonModal | null = null;
  @ViewChild('modalDespara')  modalDespara:  IonModal | null = null;
  @ViewChild('modalComidas')  modalComidas:  IonModal | null = null;
  @ViewChild('modalComida')   modalComida:   IonModal | null = null;
  @ViewChild('modalExcreciones') modalExcreciones: IonModal | null = null;
  @ViewChild('modalExcrecion')   modalExcrecion:   IonModal | null = null;

  formMascota!: FormGroup;
  formSalud!:   FormGroup;
  formVacuna!:  FormGroup;
  formDespara!: FormGroup;
  formComida!:  FormGroup;
  formExcrecion!: FormGroup;

  mascotas:       Mascota[]         = [];
  registrosSalud: Salud[]           = [];
  todasVacunas:   Vacuna[]          = [];
  todasDesparas:  Desparasitacion[] = [];
  todasComidas:   Comida[]          = [];
  todasExcreciones: Excrecion[]      = [];
  cargandoDatos = false;

  // Estado mascota
  editandoMascotaId: string | null  = null;
  mascotaEditando:   Mascota | null = null;

  // Estado salud
  editandoSaludId:              string | null  = null;
  mascotaSeleccionadaParaSalud: Mascota | null = null;

  // Estado vacunas
  mascotaSeleccionadaParaVacunas: Mascota | null = null;
  editandoVacunaId:               string | null  = null;

  // Estado desparasitaciones
  mascotaSeleccionadaParaDesparas: Mascota | null = null;
  editandoDesparaId:               string | null  = null;

  // Estado comidas
  mascotaSeleccionadaParaComidas: Mascota | null = null;
  editandoComidaId:               string | null  = null;

  // Estado excreciones
  mascotaSeleccionadaParaExcreciones: Mascota | null = null;
  editandoExcrecionId:                string | null  = null;
  private _vistaComidas: string = 'hoy';
  get vistaComidas(): string { return this._vistaComidas; }
  set vistaComidas(val: string) {
    this._vistaComidas = val;
    this.cdr.markForCheck();
  }
  fechaHoy: string = '';

  // Datos precalculados para evitar recalcular en cada ciclo de detección de cambios
  comidasHoyCache:       Map<string, Comida[]>                              = new Map();
  comidasAgrupadasCache: Map<string, {fecha:string; comidas:Comida[]; total:number}[]> = new Map();
  excrecionesHoyCache:   Map<string, Excrecion[]>                           = new Map();
  excrecionesAgrupadasCache: Map<string, {fecha:string; excreciones:Excrecion[]}[]>   = new Map();
  totalGrHoyCache:       Map<string, number>                                = new Map();

  constructor(
    private fb: FormBuilder,
    private sheetsService: SheetsService,
    private toastCtrl:    ToastController,
    private loadingCtrl:  LoadingController,
    private alertCtrl:    AlertController,
    private cdr:          ChangeDetectorRef
  ) {
    addIcons({
      saveOutline, refreshOutline, trashOutline, pawOutline,
      createOutline, closeOutline, addOutline, heartOutline,
      medkitOutline, addCircleOutline, shieldCheckmarkOutline,
      nutritionOutline, restaurantOutline, timeOutline, flaskOutline,
    });
    // Fecha de hoy normalizada sin ceros: d/m/yyyy
    const hoy = new Date();
    const raw = hoy.toLocaleDateString('es-ES'); // puede dar "29/5/2026" o "09/05/2026"
    const partes = raw.split('/');
    this.fechaHoy = `${parseInt(partes[0])}/${parseInt(partes[1])}/${partes[2]}`;
  }

  ngOnInit() {
    this.formMascota = this.fb.group({
      nombre:           new FormControl('', [Validators.required, Validators.minLength(2)]),
      especie:          new FormControl('', Validators.required),
      raza:             new FormControl('', Validators.required),
      fecha_nacimiento: new FormControl('', Validators.required),
      sexo:             new FormControl('', Validators.required),
      propietario:      new FormControl('', [Validators.required, Validators.minLength(2)])
    });
    this.formSalud = this.fb.group({
      peso:         new FormControl('', [Validators.required, Validators.min(0.1), Validators.max(1000)]),
      talla:        new FormControl('', [Validators.required, Validators.min(1), Validators.max(300)]),
      enfermedades: new FormControl('', Validators.required)
    });
    this.formVacuna = this.fb.group({
      tipo_vacuna:      new FormControl('', Validators.required),
      fecha_aplicacion: new FormControl('', Validators.required),
      proxima_dosis:    new FormControl(''),
      observaciones:    new FormControl(''),
      peso:             new FormControl('', [Validators.required, Validators.min(0.1), Validators.max(1000)])
    });
    this.formDespara = this.fb.group({
      nombre_desparasitante: new FormControl('', Validators.required),
      fecha_aplicacion:      new FormControl('', Validators.required),
      proxima_dosis:         new FormControl(''),
      observaciones:         new FormControl(''),
      peso:                  new FormControl('', [Validators.required, Validators.min(0.1), Validators.max(1000)])
    });
    this.formComida = this.fb.group({
      tipo_comida:   new FormControl('', Validators.required),
      cantidad:      new FormControl('', [Validators.required, Validators.min(1), Validators.max(9999)]),
      hora:          new FormControl('', Validators.required),
      observaciones: new FormControl('')
    });
    this.formExcrecion = this.fb.group({
      tipo:          new FormControl('', Validators.required),
      cantidad:      new FormControl('', Validators.required),
      consistencia:  new FormControl(''),
      color:         new FormControl(''),
      hora:          new FormControl('', Validators.required),
      observaciones: new FormControl('')
    });
    this.cargarDatos();
  }

  // ─── Getters tipados ──────────────────────────────────────────────────────
  get nombreCtrl()                { return this.formMascota.get('nombre')                as FormControl; }
  get especieCtrl()               { return this.formMascota.get('especie')               as FormControl; }
  get razaCtrl()                  { return this.formMascota.get('raza')                  as FormControl; }
  get fechaNacimientoCtrl()       { return this.formMascota.get('fecha_nacimiento')       as FormControl; }
  get sexoCtrl()                  { return this.formMascota.get('sexo')                  as FormControl; }
  get propietarioCtrl()           { return this.formMascota.get('propietario')            as FormControl; }
  get pesoCtrl()                  { return this.formSalud.get('peso')                    as FormControl; }
  get tallaCtrl()                 { return this.formSalud.get('talla')                   as FormControl; }
  get enfermedadesCtrl()          { return this.formSalud.get('enfermedades')             as FormControl; }
  get tipoVacunaCtrl()            { return this.formVacuna.get('tipo_vacuna')             as FormControl; }
  get fechaAplicacionVacCtrl()    { return this.formVacuna.get('fecha_aplicacion')        as FormControl; }
  get proximaDosisVacCtrl()       { return this.formVacuna.get('proxima_dosis')           as FormControl; }
  get observacionesVacCtrl()      { return this.formVacuna.get('observaciones')           as FormControl; }
  get pesoVacunaCtrl()            { return this.formVacuna.get('peso')                   as FormControl; }
  get nombreDesparasitanteCtrl()  { return this.formDespara.get('nombre_desparasitante')  as FormControl; }
  get fechaAplicacionDesCtrl()    { return this.formDespara.get('fecha_aplicacion')       as FormControl; }
  get proximaDosisDesCtrl()       { return this.formDespara.get('proxima_dosis')          as FormControl; }
  get observacionesDesCtrl()      { return this.formDespara.get('observaciones')          as FormControl; }
  get pesoDesparaCtrl()           { return this.formDespara.get('peso')                  as FormControl; }
  get tipoComidaCtrl()            { return this.formComida.get('tipo_comida')             as FormControl; }
  get cantidadCtrl()              { return this.formComida.get('cantidad')                as FormControl; }
  get horaCtrl()                  { return this.formComida.get('hora')                   as FormControl; }
  get observacionesComidaCtrl()   { return this.formComida.get('observaciones')           as FormControl; }
  get tipoExcrecionCtrl()         { return this.formExcrecion.get('tipo')          as FormControl; }
  get cantidadExcrecionCtrl()     { return this.formExcrecion.get('cantidad')       as FormControl; }
  get consistenciaCtrl()          { return this.formExcrecion.get('consistencia')   as FormControl; }
  get colorCtrl()                 { return this.formExcrecion.get('color')          as FormControl; }
  get horaExcrecionCtrl()         { return this.formExcrecion.get('hora')           as FormControl; }
  get observacionesExcCtrl()      { return this.formExcrecion.get('observaciones')  as FormControl; }

  // ─── FECHAS ───────────────────────────────────────────────────────────────
  private aFormatoInput(fecha: any): string {
    if (!fecha) return '';
    if (fecha instanceof Date) {
      return `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth()+1).padStart(2,'0')}-${String(fecha.getUTCDate()).padStart(2,'0')}`;
    }
    const str = String(fecha).trim();
    if (str.includes('T')) return str.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    if (/^\d{2}-\d{2}-\d{4}$/.test(str)) { const [d,m,y]=str.split('-'); return `${y}-${m}-${d}`; }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) { const [d,m,y]=str.split('/'); return `${y}-${m}-${d}`; }
    if (/^\d{4,6}$/.test(str)) {
      const d = new Date((parseInt(str)-25569)*86400*1000);
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
    }
    return str;
  }

  private aFormatoSheet(fecha: string): string {
    if (!fecha) return '';
    const str = String(fecha).trim();
    if (str.includes('T')) return str.split('T')[0];
    if (/^\d{2}-\d{2}-\d{4}$/.test(str)) { const [d,m,y]=str.split('-'); return `${y}-${m}-${d}`; }
    return str;
  }

  calcularEdad(fecha: any): string {
    const iso = this.aFormatoInput(fecha);
    if (!iso) return '';
    const hoy = new Date();
    const nac = new Date(iso + 'T12:00:00');
    if (isNaN(nac.getTime())) return '';
    const años = hoy.getFullYear() - nac.getFullYear();
    const meses = hoy.getMonth() - nac.getMonth();
    if (años === 0) return `${meses < 0 ? 0 : meses} meses`;
    return `${años} año${años !== 1 ? 's' : ''}`;
  }

  // Precalcula todos los datos de comidas y excreciones para evitar cálculos en el template
  recalcularCache() {
    this.comidasHoyCache.clear();
    this.comidasAgrupadasCache.clear();
    this.totalGrHoyCache.clear();
    this.excrecionesHoyCache.clear();
    this.excrecionesAgrupadasCache.clear();

    this.mascotas.forEach(m => {
      const id = String(m.id);

      // Comidas hoy
      const cHoy = this.todasComidas.filter(c =>
        String(c.id_persona) === id &&
        this.normalizarFechaRegistro(c.fechaRegistro) === this.fechaHoy
      );
      this.comidasHoyCache.set(id, cHoy);
      this.totalGrHoyCache.set(id, cHoy.reduce((s, c) => s + Number(c.cantidad || 0), 0));

      // Comidas agrupadas
      const todasC = this.todasComidas.filter(c => String(c.id_persona) === id);
      const mapaC = new Map<string, Comida[]>();
      todasC.forEach(c => {
        const f = this.normalizarFechaRegistro(c.fechaRegistro) || 'Sin fecha';
        if (!mapaC.has(f)) mapaC.set(f, []);
        mapaC.get(f)!.push(c);
      });
      this.comidasAgrupadasCache.set(id, Array.from(mapaC.entries())
        .map(([fecha, comidas]) => ({ fecha, comidas, total: comidas.reduce((s, c) => s + Number(c.cantidad || 0), 0) }))
        .sort((a, b) => b.fecha.localeCompare(a.fecha)));

      // Excreciones hoy
      const eHoy = this.todasExcreciones.filter(e =>
        String(e.id_persona) === id &&
        this.normalizarFechaRegistro(e.fechaRegistro) === this.fechaHoy
      );
      this.excrecionesHoyCache.set(id, eHoy);

      // Excreciones agrupadas
      const todasE = this.todasExcreciones.filter(e => String(e.id_persona) === id);
      const mapaE = new Map<string, Excrecion[]>();
      todasE.forEach(e => {
        const f = this.normalizarFechaRegistro(e.fechaRegistro) || 'Sin fecha';
        if (!mapaE.has(f)) mapaE.set(f, []);
        mapaE.get(f)!.push(e);
      });
      this.excrecionesAgrupadasCache.set(id, Array.from(mapaE.entries())
        .map(([fecha, excreciones]) => ({ fecha, excreciones }))
        .sort((a, b) => b.fecha.localeCompare(a.fecha)));
    });
  }

  formatearFecha(fecha: any): string {
    const iso = this.aFormatoInput(fecha);
    if (!iso) return '';
    const [y,m,d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  // Normaliza cualquier formato de fecha a d/m/yyyy para comparar con fechaHoy
  private normalizarFechaRegistro(fecha: any): string {
    if (!fecha) return '';
    const str = String(fecha).trim();

    // ISO con zona horaria: "2026-05-27T04:00:00.000Z" → "27/5/2026"
    if (str.includes('T')) {
      const iso = str.split('T')[0];
      const [y, m, d] = iso.split('-');
      return `${parseInt(d)}/${parseInt(m)}/${y}`;
    }
    // yyyy-MM-dd → d/m/yyyy
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [y, m, d] = str.split('-');
      return `${parseInt(d)}/${parseInt(m)}/${y}`;
    }
    // Ya está en d/m/yyyy o dd/mm/yyyy — normalizar sin ceros
    if (str.includes('/')) {
      const partes = str.split('/');
      if (partes.length === 3) {
        return `${parseInt(partes[0])}/${parseInt(partes[1])}/${partes[2]}`;
      }
    }
    return str;
  }

  // Compara cualquier formato de fecha con hoy
  esFechaHoy(fecha: any): boolean {
    if (!fecha) return false;
    const str = String(fecha).trim();
    const hoy = new Date();
    const hoyISO = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}-${String(hoy.getDate()).padStart(2,'0')}`;
    const hoyLocal = hoy.toLocaleDateString('es-ES'); // dd/mm/yyyy

    // ISO con T
    if (str.includes('T')) return str.split('T')[0] === hoyISO;
    // yyyy-MM-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str === hoyISO;
    // dd/mm/yyyy o d/m/yyyy
    if (str.includes('/')) return str === hoyLocal;
    // dd-mm-yyyy
    if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
      const [d,m,y] = str.split('-');
      return `${y}-${m}-${d}` === hoyISO;
    }
    return false;
  }

  // ─── CARGAR DATOS ─────────────────────────────────────────────────────────
  cargarDatos() {
    this.cargandoDatos = true;
    this.sheetsService.obtenerMascotas().subscribe({
      next: (datos) => {
        this.mascotas = datos;
        this.cargarSalud();
        this.cargarVacunas();
        this.cargarDesparas();
        this.cargarComidas();
        this.cargarExcreciones();
      },
      error: () => { this.mostrarToast('❌ Error al cargar mascotas', 'danger'); this.cargandoDatos = false; }
    });
  }

  cargarSalud()    {
    this.sheetsService.obtenerSalud().subscribe({
      next: d => { this.registrosSalud = d.map((s: any) => ({ ...s, fechaRegistro: s.fechaRegistro || s.fecharegistro || '' })); },
      error: () => {}
    });
  }
  cargarVacunas()  {
    this.sheetsService.obtenerVacunas().subscribe({
      next: d => { this.todasVacunas = d.map((v: any) => ({ ...v, fechaRegistro: v.fechaRegistro || v.fecharegistro || '' })); },
      error: () => {}
    });
  }
  cargarDesparas() {
    this.sheetsService.obtenerDesparasitaciones().subscribe({
      next: d => { this.todasDesparas = d.map((x: any) => ({ ...x, fechaRegistro: x.fechaRegistro || x.fecharegistro || '' })); },
      error: () => {}
    });
  }
  cargarComidas()  {
    this.sheetsService.obtenerComidas().subscribe({
      next: d => {
        this.todasComidas = d.map((c: any) => ({
          ...c,
          fechaRegistro: c.fechaRegistro || c.fecharegistro || ''
        }));
        this.cargandoDatos = false;
        this.recalcularCache();
      },
      error: () => { this.cargandoDatos = false; }
    });
  }
  cargarExcreciones() {
    this.sheetsService.obtenerExcreciones().subscribe({
      next: d => {
        this.todasExcreciones = d.map((e: any) => ({
          ...e,
          fechaRegistro: e.fechaRegistro || e.fecharegistro || ''
        }));
        this.recalcularCache();
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────
  getSaludDeMascota(id: string): Salud | null {
    return this.registrosSalud.find(s => String(s.id_persona) === String(id)) || null;
  }
  getVacunasDeMascota(id: string): Vacuna[] {
    return this.todasVacunas.filter(v => String(v.id_persona) === String(id));
  }
  getDesparasDeMascota(id: string): Desparasitacion[] {
    return this.todasDesparas.filter(d => String(d.id_persona) === String(id));
  }
  getExcrecionesDeMascota(id: string): Excrecion[] {
    return this.todasExcreciones.filter(e => String(e.id_persona) === String(id));
  }
  getExcrecionesHoy(id: string): Excrecion[] {
    return this.getExcrecionesDeMascota(id).filter(e => this.esFechaHoy(e.fechaRegistro));
  }
  getExcrecionesAgrupadas(id: string): { fecha: string; excreciones: Excrecion[] }[] {
    return this.excrecionesAgrupadasCache.get(String(id)) || [];
  }
  getComidasDeMascota(id: string): Comida[] {
    return this.todasComidas.filter(c => String(c.id_persona) === String(id));
  }
  getComidasHoy(id: string): Comida[] {
    return this.getComidasDeMascota(id).filter(c => this.esFechaHoy(c.fechaRegistro));
  }
  getTotalGrHoy(id: string): number {
    return this.totalGrHoyCache.get(String(id)) || 0;
  }
  // Agrupa comidas por fecha para el historial
  getComidasAgrupadas(id: string): { fecha: string; comidas: Comida[]; total: number }[] {
    const mapa = new Map<string, Comida[]>();
    this.getComidasDeMascota(id).forEach(c => {
      const f = this.normalizarFechaRegistro(c.fechaRegistro || (c as any).fecharegistro) || 'Sin fecha';
      if (!mapa.has(f)) mapa.set(f, []);
      mapa.get(f)!.push(c);
    });
    return Array.from(mapa.entries())
      .map(([fecha, comidas]) => ({
        fecha,
        comidas,
        total: comidas.reduce((s, c) => s + Number(c.cantidad || 0), 0)
      }))
      .sort((a, b) => b.fecha.localeCompare(a.fecha)); // más reciente primero
  }

  trackById(index: number, item: any) {
    return item.id || item.id_vacuna || item.id_desparasitacion || item.id_comida;
  }

  esInvalidoMascota(c: string) { const ctrl = this.formMascota.get(c); return !!(ctrl?.invalid && ctrl?.touched); }
  esInvalidoSalud(c: string)   { const ctrl = this.formSalud.get(c);   return !!(ctrl?.invalid && ctrl?.touched); }
  esInvalidoVacuna(c: string)  { const ctrl = this.formVacuna.get(c);  return !!(ctrl?.invalid && ctrl?.touched); }
  esInvalidoDespara(c: string) { const ctrl = this.formDespara.get(c); return !!(ctrl?.invalid && ctrl?.touched); }
  esInvalidoComida(c: string)  { const ctrl = this.formComida.get(c);  return !!(ctrl?.invalid && ctrl?.touched); }
  esInvalidoExcrecion(c: string){ const ctrl = this.formExcrecion.get(c); return !!(ctrl?.invalid && ctrl?.touched); }

  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastCtrl.create({ message: mensaje, duration: 2500, color, position: 'top' });
    toast.present();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MASCOTA
  // ══════════════════════════════════════════════════════════════════════════
  abrirModalNuevaMascota() { this.editandoMascotaId = null; this.mascotaEditando = null; this.formMascota.reset(); this.modalMascota?.present(); }

  editarMascota(mascota: Mascota) {
    this.editandoMascotaId = mascota.id; this.mascotaEditando = mascota;
    this.formMascota.patchValue({ nombre: mascota.nombre, especie: mascota.especie, raza: mascota.raza,
      fecha_nacimiento: this.aFormatoInput(mascota.fecha_nacimiento), sexo: mascota.sexo, propietario: mascota.propietario });
    this.modalMascota?.present();
  }

  cancelarMascota() { this.editandoMascotaId = null; this.mascotaEditando = null; this.formMascota.reset(); this.modalMascota?.dismiss(); }

  async guardarMascota() {
    if (this.formMascota.invalid) { this.formMascota.markAllAsTouched(); return; }
    const esEdicion = !!this.editandoMascotaId;
    const loading = await this.loadingCtrl.create({ message: esEdicion ? 'Actualizando...' : 'Guardando...' });
    await loading.present();
    const v = this.formMascota.value;
    const mascota: Mascota = { id: this.editandoMascotaId || Date.now().toString(), nombre: v.nombre,
      especie: v.especie, raza: v.raza, fecha_nacimiento: this.aFormatoSheet(v.fecha_nacimiento),
      sexo: v.sexo, propietario: v.propietario,
      fechaRegistro: this.mascotaEditando?.fechaRegistro || new Date().toLocaleDateString('es-ES') };
    try {
      await this.sheetsService.guardarMascota(mascota, esEdicion ? 'UPDATE' : 'CREATE');
      await loading.dismiss(); this.cancelarMascota();
      this.mostrarToast(esEdicion ? '✏️ Actualizada' : '🐾 Mascota registrada', 'success');
      setTimeout(() => this.cargarDatos(), 1500);
    } catch { await loading.dismiss(); this.mostrarToast('❌ Error al guardar', 'danger'); }
  }

  async eliminarMascota(mascota: Mascota) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar mascota',
      message: `¿Eliminar a ${mascota.nombre}? Se eliminarán todos sus registros.`,
      buttons: [{ text: 'Cancelar', role: 'cancel' }, { text: 'Eliminar', role: 'destructive', handler: async () => {
        const loading = await this.loadingCtrl.create({ message: 'Eliminando...' });
        await loading.present();
        try {
          const salud = this.getSaludDeMascota(mascota.id);
          if (salud) await this.sheetsService.eliminarSalud(salud.id_salud);
          for (const v of this.getVacunasDeMascota(mascota.id)) await this.sheetsService.eliminarVacuna(v.id_vacuna);
          for (const d of this.getDesparasDeMascota(mascota.id)) await this.sheetsService.eliminarDesparasitacion(d.id_desparasitacion);
          for (const c of this.getComidasDeMascota(mascota.id)) await this.sheetsService.eliminarComida(c.id_comida);
              for (const e of this.getExcrecionesDeMascota(mascota.id)) await this.sheetsService.eliminarExcrecion(e.id_excrecion);
          await this.sheetsService.eliminarMascota(mascota.id);
          this.mascotas      = this.mascotas.filter(m => m.id !== mascota.id);
          this.registrosSalud = this.registrosSalud.filter(s => String(s.id_persona) !== String(mascota.id));
          this.todasVacunas  = this.todasVacunas.filter(v => String(v.id_persona) !== String(mascota.id));
          this.todasDesparas = this.todasDesparas.filter(d => String(d.id_persona) !== String(mascota.id));
          this.todasComidas  = this.todasComidas.filter(c => String(c.id_persona) !== String(mascota.id));
              this.todasExcreciones = this.todasExcreciones.filter(e => String(e.id_persona) !== String(mascota.id));
          await loading.dismiss(); this.mostrarToast('🗑️ Eliminada', 'success');
        } catch { await loading.dismiss(); this.mostrarToast('❌ Error al eliminar', 'danger'); }
      }}]
    });
    await alert.present();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SALUD
  // ══════════════════════════════════════════════════════════════════════════
  abrirModalSalud(mascota: Mascota) {
    this.mascotaSeleccionadaParaSalud = mascota;
    const s = this.getSaludDeMascota(mascota.id);
    if (s) { this.editandoSaludId = s.id_salud; this.formSalud.patchValue({ peso: s.peso, talla: s.talla, enfermedades: s.enfermedades }); }
    else   { this.editandoSaludId = null; this.formSalud.reset(); }
    this.modalSalud?.present();
  }
  cancelarSalud() { this.editandoSaludId = null; this.mascotaSeleccionadaParaSalud = null; this.formSalud.reset(); this.modalSalud?.dismiss(); }
  async guardarSalud() {
    if (this.formSalud.invalid) { this.formSalud.markAllAsTouched(); return; }
    if (!this.mascotaSeleccionadaParaSalud) return;
    const esEdicion = !!this.editandoSaludId;
    const loading = await this.loadingCtrl.create({ message: esEdicion ? 'Actualizando...' : 'Guardando...' });
    await loading.present();
    const salud: Salud = { id_salud: this.editandoSaludId || Date.now().toString(),
      id_persona: this.mascotaSeleccionadaParaSalud.id, ...this.formSalud.value,
      fechaRegistro: new Date().toLocaleDateString('es-ES') };
    try {
      await this.sheetsService.guardarSalud(salud, esEdicion ? 'UPDATE' : 'CREATE');
      await loading.dismiss(); this.cancelarSalud();
      this.mostrarToast(esEdicion ? '✏️ Actualizada' : '💊 Salud guardada', 'success');
      setTimeout(() => this.cargarDatos(), 1500);
    } catch { await loading.dismiss(); this.mostrarToast('❌ Error al guardar', 'danger'); }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VACUNAS
  // ══════════════════════════════════════════════════════════════════════════
  abrirModalVacunas(mascota: Mascota) { this.mascotaSeleccionadaParaVacunas = mascota; this.modalVacunas?.present(); }
  cerrarModalVacunas() { this.mascotaSeleccionadaParaVacunas = null; this.modalVacunas?.dismiss(); }
  abrirFormularioVacuna(vacuna?: Vacuna) {
    if (vacuna) { this.editandoVacunaId = vacuna.id_vacuna; this.formVacuna.patchValue({
      tipo_vacuna: vacuna.tipo_vacuna, fecha_aplicacion: this.aFormatoInput(vacuna.fecha_aplicacion),
      proxima_dosis: this.aFormatoInput(vacuna.proxima_dosis), observaciones: vacuna.observaciones, peso: vacuna.peso });
    } else { this.editandoVacunaId = null; this.formVacuna.reset(); }
    this.modalVacuna?.present();
  }
  cancelarVacuna() { this.editandoVacunaId = null; this.formVacuna.reset(); this.modalVacuna?.dismiss(); }
  async guardarVacuna() {
    if (this.formVacuna.invalid) { this.formVacuna.markAllAsTouched(); return; }
    if (!this.mascotaSeleccionadaParaVacunas) return;
    const esEdicion = !!this.editandoVacunaId;
    const loading = await this.loadingCtrl.create({ message: esEdicion ? 'Actualizando...' : 'Guardando...' });
    await loading.present();
    const val = this.formVacuna.value;
    const vacuna: Vacuna = { id_vacuna: this.editandoVacunaId || Date.now().toString(),
      id_persona: this.mascotaSeleccionadaParaVacunas.id, tipo_vacuna: val.tipo_vacuna,
      fecha_aplicacion: this.aFormatoSheet(val.fecha_aplicacion), proxima_dosis: this.aFormatoSheet(val.proxima_dosis),
      observaciones: val.observaciones, peso: val.peso, fechaRegistro: new Date().toLocaleDateString('es-ES') };
    try {
      await this.sheetsService.guardarVacuna(vacuna, esEdicion ? 'UPDATE' : 'CREATE');
      await loading.dismiss(); this.cancelarVacuna();
      this.mostrarToast(esEdicion ? '✏️ Actualizada' : '💉 Vacuna registrada', 'success');
      setTimeout(() => this.cargarVacunas(), 1500);
    } catch { await loading.dismiss(); this.mostrarToast('❌ Error al guardar', 'danger'); }
  }
  async eliminarVacuna(vacuna: Vacuna) {
    const alert = await this.alertCtrl.create({ header: 'Eliminar vacuna',
      message: `¿Eliminar vacuna del ${this.formatearFecha(vacuna.fecha_aplicacion)}?`,
      buttons: [{ text: 'Cancelar', role: 'cancel' }, { text: 'Eliminar', role: 'destructive', handler: async () => {
        const loading = await this.loadingCtrl.create({ message: 'Eliminando...' }); await loading.present();
        try { await this.sheetsService.eliminarVacuna(vacuna.id_vacuna);
          this.todasVacunas = this.todasVacunas.filter(v => v.id_vacuna !== vacuna.id_vacuna);
          await loading.dismiss(); this.mostrarToast('🗑️ Eliminada', 'success');
        } catch { await loading.dismiss(); this.mostrarToast('❌ Error', 'danger'); }
      }}]
    });
    await alert.present();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DESPARASITACIONES
  // ══════════════════════════════════════════════════════════════════════════
  abrirModalDesparas(mascota: Mascota) { this.mascotaSeleccionadaParaDesparas = mascota; this.modalDesparas?.present(); }
  cerrarModalDesparas() { this.mascotaSeleccionadaParaDesparas = null; this.modalDesparas?.dismiss(); }
  abrirFormularioDespara(d?: Desparasitacion) {
    if (d) { this.editandoDesparaId = d.id_desparasitacion; this.formDespara.patchValue({
      nombre_desparasitante: d.nombre_desparasitante, fecha_aplicacion: this.aFormatoInput(d.fecha_aplicacion),
      proxima_dosis: this.aFormatoInput(d.proxima_dosis), observaciones: d.observaciones, peso: d.peso });
    } else { this.editandoDesparaId = null; this.formDespara.reset(); }
    this.modalDespara?.present();
  }
  cancelarDespara() { this.editandoDesparaId = null; this.formDespara.reset(); this.modalDespara?.dismiss(); }
  async guardarDespara() {
    if (this.formDespara.invalid) { this.formDespara.markAllAsTouched(); return; }
    if (!this.mascotaSeleccionadaParaDesparas) return;
    const esEdicion = !!this.editandoDesparaId;
    const loading = await this.loadingCtrl.create({ message: esEdicion ? 'Actualizando...' : 'Guardando...' });
    await loading.present();
    const val = this.formDespara.value;
    const despara: Desparasitacion = { id_desparasitacion: this.editandoDesparaId || Date.now().toString(),
      id_persona: this.mascotaSeleccionadaParaDesparas.id, nombre_desparasitante: val.nombre_desparasitante,
      fecha_aplicacion: this.aFormatoSheet(val.fecha_aplicacion), proxima_dosis: this.aFormatoSheet(val.proxima_dosis),
      observaciones: val.observaciones, peso: val.peso, fechaRegistro: new Date().toLocaleDateString('es-ES') };
    try {
      await this.sheetsService.guardarDesparasitacion(despara, esEdicion ? 'UPDATE' : 'CREATE');
      await loading.dismiss(); this.cancelarDespara();
      this.mostrarToast(esEdicion ? '✏️ Actualizada' : '💊 Desparasitación registrada', 'success');
      setTimeout(() => this.cargarDesparas(), 1500);
    } catch { await loading.dismiss(); this.mostrarToast('❌ Error al guardar', 'danger'); }
  }
  async eliminarDespara(d: Desparasitacion) {
    const alert = await this.alertCtrl.create({ header: 'Eliminar desparasitación',
      message: `¿Eliminar desparasitación del ${this.formatearFecha(d.fecha_aplicacion)}?`,
      buttons: [{ text: 'Cancelar', role: 'cancel' }, { text: 'Eliminar', role: 'destructive', handler: async () => {
        const loading = await this.loadingCtrl.create({ message: 'Eliminando...' }); await loading.present();
        try { await this.sheetsService.eliminarDesparasitacion(d.id_desparasitacion);
          this.todasDesparas = this.todasDesparas.filter(x => x.id_desparasitacion !== d.id_desparasitacion);
          await loading.dismiss(); this.mostrarToast('🗑️ Eliminada', 'success');
        } catch { await loading.dismiss(); this.mostrarToast('❌ Error', 'danger'); }
      }}]
    });
    await alert.present();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // COMIDAS
  // ══════════════════════════════════════════════════════════════════════════
  abrirModalComidas(mascota: Mascota) {
    this.mascotaSeleccionadaParaComidas = mascota;
    this.vistaComidas = 'hoy';
    this.modalComidas?.present();
  }
  cerrarModalComidas() { this.mascotaSeleccionadaParaComidas = null; this.modalComidas?.dismiss(); }

  abrirFormularioComida(comida?: Comida) {
    if (comida) {
      this.editandoComidaId = comida.id_comida;
      this.formComida.patchValue({ tipo_comida: comida.tipo_comida, cantidad: comida.cantidad,
        hora: comida.hora, observaciones: comida.observaciones });
    } else {
      this.editandoComidaId = null;
      this.formComida.reset();
      // Pre-llenar hora actual
      const ahora = new Date();
      const hh = String(ahora.getHours()).padStart(2, '0');
      const mm = String(ahora.getMinutes()).padStart(2, '0');
      this.formComida.patchValue({ hora: `${hh}:${mm}` });
    }
    this.modalComida?.present();
  }
  cancelarComida() { this.editandoComidaId = null; this.formComida.reset(); this.modalComida?.dismiss(); }

  async guardarComida() {
    if (this.formComida.invalid) { this.formComida.markAllAsTouched(); return; }
    if (!this.mascotaSeleccionadaParaComidas) return;
    const esEdicion = !!this.editandoComidaId;
    const loading = await this.loadingCtrl.create({ message: esEdicion ? 'Actualizando...' : 'Guardando...' });
    await loading.present();
    const val = this.formComida.value;
    const comida: Comida = {
      id_comida:     this.editandoComidaId || Date.now().toString(),
      id_persona:    this.mascotaSeleccionadaParaComidas.id,
      tipo_comida:   val.tipo_comida,
      cantidad:      Number(val.cantidad),
      hora:          val.hora,
      observaciones: val.observaciones || '',
      fechaRegistro: this.fechaHoy
    };
    try {
      await this.sheetsService.guardarComida(comida, esEdicion ? 'UPDATE' : 'CREATE');
      // Actualizar lista local inmediatamente
      if (esEdicion) {
        this.todasComidas = this.todasComidas.map(c => c.id_comida === comida.id_comida ? comida : c);
      } else {
        this.todasComidas = [...this.todasComidas, comida];
      }
      await loading.dismiss(); this.cancelarComida();
      this.mostrarToast(esEdicion ? '✏️ Actualizada' : `🍽️ +${comida.cantidad}g registrados`, 'success');
    } catch { await loading.dismiss(); this.mostrarToast('❌ Error al guardar', 'danger'); }
  }

  async eliminarComida(comida: Comida) {
    const alert = await this.alertCtrl.create({ header: 'Eliminar comida',
      message: `¿Eliminar ${comida.tipo_comida} (${comida.cantidad}g)?`,
      buttons: [{ text: 'Cancelar', role: 'cancel' }, { text: 'Eliminar', role: 'destructive', handler: async () => {
        const loading = await this.loadingCtrl.create({ message: 'Eliminando...' }); await loading.present();
        try { await this.sheetsService.eliminarComida(comida.id_comida);
          this.todasComidas = this.todasComidas.filter(c => c.id_comida !== comida.id_comida);
          await loading.dismiss(); this.mostrarToast('🗑️ Eliminada', 'success');
        } catch { await loading.dismiss(); this.mostrarToast('❌ Error', 'danger'); }
      }}]
    });
    await alert.present();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // EXCRECIONES
  // ══════════════════════════════════════════════════════════════════════════
  abrirModalExcreciones(mascota: Mascota) {
    this.mascotaSeleccionadaParaExcreciones = mascota;
    this.vistaComidas = 'hoy';
    this.modalExcreciones?.present();
  }

  cerrarModalExcreciones() {
    this.mascotaSeleccionadaParaExcreciones = null;
    this.modalExcreciones?.dismiss();
  }

  abrirFormularioExcrecion(excrecion?: Excrecion) {
    if (excrecion) {
      this.editandoExcrecionId = excrecion.id_excrecion;
      this.formExcrecion.patchValue({
        tipo:          excrecion.tipo,
        cantidad:      excrecion.cantidad,
        consistencia:  excrecion.consistencia,
        color:         excrecion.color,
        hora:          excrecion.hora,
        observaciones: excrecion.observaciones
      });
    } else {
      this.editandoExcrecionId = null;
      this.formExcrecion.reset();
      const ahora = new Date();
      const hh = String(ahora.getHours()).padStart(2, '0');
      const mm = String(ahora.getMinutes()).padStart(2, '0');
      this.formExcrecion.patchValue({ hora: `${hh}:${mm}` });
    }
    this.modalExcrecion?.present();
  }

  cancelarExcrecion() {
    this.editandoExcrecionId = null;
    this.formExcrecion.reset();
    this.modalExcrecion?.dismiss();
  }

  async guardarExcrecion() {
    if (this.formExcrecion.invalid) { this.formExcrecion.markAllAsTouched(); return; }
    if (!this.mascotaSeleccionadaParaExcreciones) return;

    const esEdicion = !!this.editandoExcrecionId;
    const loading = await this.loadingCtrl.create({ message: esEdicion ? 'Actualizando...' : 'Guardando...' });
    await loading.present();

    const val = this.formExcrecion.value;
    const excrecion: Excrecion = {
      id_excrecion:  this.editandoExcrecionId || Date.now().toString(),
      id_persona:    this.mascotaSeleccionadaParaExcreciones.id,
      tipo:          val.tipo,
      cantidad:      val.cantidad,
      consistencia:  val.consistencia || '',
      color:         val.color || '',
      hora:          val.hora,
      observaciones: val.observaciones || '',
      fechaRegistro: this.fechaHoy
    };

    try {
      await this.sheetsService.guardarExcrecion(excrecion, esEdicion ? 'UPDATE' : 'CREATE');
      if (esEdicion) {
        this.todasExcreciones = this.todasExcreciones.map(e => e.id_excrecion === excrecion.id_excrecion ? excrecion : e);
      } else {
        this.todasExcreciones = [...this.todasExcreciones, excrecion];
      }
      await loading.dismiss();
      this.cancelarExcrecion();
      this.mostrarToast(esEdicion ? '✏️ Actualizado' : `✅ ${val.tipo} registrado`, 'success');
    } catch {
      await loading.dismiss();
      this.mostrarToast('❌ Error al guardar', 'danger');
    }
  }

  async eliminarExcrecion(excrecion: Excrecion) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar registro',
      message: `¿Eliminar registro de ${excrecion.tipo} (${excrecion.hora})?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar', role: 'destructive',
          handler: async () => {
            const loading = await this.loadingCtrl.create({ message: 'Eliminando...' });
            await loading.present();
            try {
              await this.sheetsService.eliminarExcrecion(excrecion.id_excrecion);
              this.todasExcreciones = this.todasExcreciones.filter(e => e.id_excrecion !== excrecion.id_excrecion);
              await loading.dismiss();
              this.mostrarToast('🗑️ Eliminado', 'success');
            } catch {
              await loading.dismiss();
              this.mostrarToast('❌ Error', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }
}
