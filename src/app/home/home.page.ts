import { Component, OnInit, ViewChild } from '@angular/core';
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
  medkitOutline, addCircleOutline, shieldCheckmarkOutline
} from 'ionicons/icons';
import { SheetsService } from '../services/sheets.service';
import { Mascota } from '../models/mascota.model';
import { Salud } from '../models/salud.model';
import { Vacuna } from '../models/vacuna.model';

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
  styleUrls: ['./home.page.scss']
})
export class HomePage implements OnInit {
  @ViewChild('modalMascota')  modalMascota:  IonModal | null = null;
  @ViewChild('modalSalud')    modalSalud:    IonModal | null = null;
  @ViewChild('modalVacunas')  modalVacunas:  IonModal | null = null;
  @ViewChild('modalVacuna')   modalVacuna:   IonModal | null = null;

  formMascota!: FormGroup;
  formSalud!:   FormGroup;
  formVacuna!:  FormGroup;

  mascotas:       Mascota[] = [];
  registrosSalud: Salud[]   = [];
  todasVacunas:   Vacuna[]  = [];
  cargandoDatos = false;

  editandoMascotaId:  string | null  = null;
  mascotaEditando:    Mascota | null = null;

  editandoSaludId:               string | null  = null;
  mascotaSeleccionadaParaSalud:  Mascota | null = null;

  mascotaSeleccionadaParaVacunas: Mascota | null = null;
  editandoVacunaId:               string | null  = null;

  constructor(
    private fb: FormBuilder,
    private sheetsService: SheetsService,
    private toastCtrl:    ToastController,
    private loadingCtrl:  LoadingController,
    private alertCtrl:    AlertController
  ) {
    addIcons({
      saveOutline, refreshOutline, trashOutline, pawOutline,
      createOutline, closeOutline, addOutline, heartOutline,
      medkitOutline, addCircleOutline, shieldCheckmarkOutline
    });
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

    this.cargarDatos();
  }

  // ─── Getters tipados ──────────────────────────────────────────────────────
  get nombreCtrl()           { return this.formMascota.get('nombre')           as FormControl; }
  get especieCtrl()          { return this.formMascota.get('especie')          as FormControl; }
  get razaCtrl()             { return this.formMascota.get('raza')             as FormControl; }
  get fechaNacimientoCtrl()  { return this.formMascota.get('fecha_nacimiento') as FormControl; }
  get sexoCtrl()             { return this.formMascota.get('sexo')             as FormControl; }
  get propietarioCtrl()      { return this.formMascota.get('propietario')      as FormControl; }
  get pesoCtrl()             { return this.formSalud.get('peso')               as FormControl; }
  get tallaCtrl()            { return this.formSalud.get('talla')              as FormControl; }
  get enfermedadesCtrl()     { return this.formSalud.get('enfermedades')       as FormControl; }
  get tipoVacunaCtrl()       { return this.formVacuna.get('tipo_vacuna')       as FormControl; }
  get fechaAplicacionCtrl()  { return this.formVacuna.get('fecha_aplicacion')  as FormControl; }
  get proximaDosisCtrl()     { return this.formVacuna.get('proxima_dosis')     as FormControl; }
  get observacionesCtrl()    { return this.formVacuna.get('observaciones')     as FormControl; }
  get pesoVacunaCtrl()       { return this.formVacuna.get('peso')              as FormControl; }

  // ─── CONVERSIÓN DE FECHAS ─────────────────────────────────────────────────
  // Cualquier formato → yyyy-MM-dd (para input type="date")
  private aFormatoInput(fecha: any): string {
    if (!fecha) return '';

    // Si es objeto Date de JavaScript
    if (fecha instanceof Date) {
      const y = fecha.getUTCFullYear();
      const m = String(fecha.getUTCMonth() + 1).padStart(2, '0');
      const d = String(fecha.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    const str = String(fecha).trim();
    console.log('[aFormatoInput] recibido:', str);

    // ISO con zona horaria: "2022-11-12T04:00:00.000Z"
    if (str.includes('T')) {
      return str.split('T')[0];
    }

    // Ya está en yyyy-MM-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

    // dd-mm-yyyy
    if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
      const [d, m, y] = str.split('-');
      return `${y}-${m}-${d}`;
    }

    // dd/mm/yyyy
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
      const [d, m, y] = str.split('/');
      return `${y}-${m}-${d}`;
    }

    // Número serial de Excel/Sheets (ej: 44927)
    if (/^\d{4,6}$/.test(str)) {
      const serial = parseInt(str);
      const d = new Date((serial - 25569) * 86400 * 1000);
      const y = d.getUTCFullYear();
      const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
      const da = String(d.getUTCDate()).padStart(2, '0');
      return `${y}-${mo}-${da}`;
    }

    console.warn('[aFormatoInput] formato no reconocido:', str);
    return '';
  }

  // yyyy-MM-dd → yyyy-MM-dd (guardamos en ISO para que codigo.gs lo trate como texto)
  private aFormatoSheet(fecha: string): string {
    if (!fecha) return '';
    const str = String(fecha).trim();
    if (str.includes('T')) return str.split('T')[0];
    // dd-mm-yyyy → yyyy-MM-dd
    if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
      const [d, m, y] = str.split('-');
      return `${y}-${m}-${d}`;
    }
    // ya está en yyyy-MM-dd
    return str;
  }

  // Fecha legible para mostrar en tarjetas: yyyy-MM-dd → dd/mm/yyyy
  formatearFecha(fecha: any): string {
    const iso = this.aFormatoInput(fecha);
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  // Calcular edad desde cualquier formato
  calcularEdad(fecha: any): string {
    if (!fecha) return '';
    const iso = this.aFormatoInput(fecha);
    if (!iso) return '';
    const hoy = new Date();
    const nac = new Date(iso + 'T12:00:00');
    if (isNaN(nac.getTime())) return '';
    const años  = hoy.getFullYear() - nac.getFullYear();
    const meses = hoy.getMonth() - nac.getMonth();
    if (años === 0) return `${meses < 0 ? 0 : meses} meses`;
    return `${años} año${años !== 1 ? 's' : ''}`;
  }

  // ─── CARGAR DATOS ─────────────────────────────────────────────────────────
  cargarDatos() {
    this.cargandoDatos = true;
    this.sheetsService.obtenerMascotas().subscribe({
      next: (datos) => {
        this.mascotas = datos;
        this.cargarSalud();
        this.cargarVacunas();
      },
      error: () => {
        this.mostrarToast('❌ Error al cargar mascotas', 'danger');
        this.cargandoDatos = false;
      }
    });
  }

  cargarSalud() {
    this.sheetsService.obtenerSalud().subscribe({
      next: (datos) => { this.registrosSalud = datos; },
      error: () => {}
    });
  }

  cargarVacunas() {
    this.sheetsService.obtenerVacunas().subscribe({
      next: (datos) => {
        this.todasVacunas = datos;
        this.cargandoDatos = false;
      },
      error: () => { this.cargandoDatos = false; }
    });
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────
  getSaludDeMascota(idMascota: string): Salud | null {
    return this.registrosSalud.find(s => String(s.id_persona) === String(idMascota)) || null;
  }

  getVacunasDeMascota(idMascota: string): Vacuna[] {
    return this.todasVacunas.filter(v => String(v.id_persona) === String(idMascota));
  }

  trackById(index: number, item: any) { return item.id || item.id_vacuna; }

  esInvalidoMascota(campo: string): boolean {
    const ctrl = this.formMascota.get(campo);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  esInvalidoSalud(campo: string): boolean {
    const ctrl = this.formSalud.get(campo);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  esInvalidoVacuna(campo: string): boolean {
    const ctrl = this.formVacuna.get(campo);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje, duration: 2500, color, position: 'top'
    });
    toast.present();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MASCOTA
  // ══════════════════════════════════════════════════════════════════════════

  abrirModalNuevaMascota() {
    this.editandoMascotaId = null;
    this.mascotaEditando = null;
    this.formMascota.reset();
    this.modalMascota?.present();
  }

  editarMascota(mascota: Mascota) {
    this.editandoMascotaId = mascota.id;
    this.mascotaEditando = mascota;
    const fechaConvertida = this.aFormatoInput(mascota.fecha_nacimiento);
    console.log('[editarMascota] fecha RAW:', mascota.fecha_nacimiento, '→ convertida:', fechaConvertida);
    this.formMascota.patchValue({
      nombre:           mascota.nombre,
      especie:          mascota.especie,
      raza:             mascota.raza,
      fecha_nacimiento: fechaConvertida,
      sexo:             mascota.sexo,
      propietario:      mascota.propietario
    });
    this.modalMascota?.present();
  }

  cancelarMascota() {
    this.editandoMascotaId = null;
    this.mascotaEditando = null;
    this.formMascota.reset();
    this.modalMascota?.dismiss();
  }

  async guardarMascota() {
    if (this.formMascota.invalid) { this.formMascota.markAllAsTouched(); return; }

    const esEdicion = !!this.editandoMascotaId;
    const loading = await this.loadingCtrl.create({
      message: esEdicion ? 'Actualizando...' : 'Guardando...'
    });
    await loading.present();

    const v = this.formMascota.value;
    const mascota: Mascota = {
      id:               this.editandoMascotaId || Date.now().toString(),
      nombre:           v.nombre,
      especie:          v.especie,
      raza:             v.raza,
      fecha_nacimiento: this.aFormatoSheet(v.fecha_nacimiento),
      sexo:             v.sexo,
      propietario:      v.propietario,
      fechaRegistro:    this.mascotaEditando?.fechaRegistro || new Date().toLocaleDateString('es-ES')
    };

    try {
      await this.sheetsService.guardarMascota(mascota, esEdicion ? 'UPDATE' : 'CREATE');
      await loading.dismiss();
      this.cancelarMascota();
      this.mostrarToast(esEdicion ? '✏️ Mascota actualizada' : '🐾 Mascota registrada', 'success');
      setTimeout(() => this.cargarDatos(), 1500);
    } catch {
      await loading.dismiss();
      this.mostrarToast('❌ Error al guardar mascota', 'danger');
    }
  }

  async eliminarMascota(mascota: Mascota) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar mascota',
      message: `¿Eliminar a ${mascota.nombre}? También se eliminarán sus datos de salud y vacunas.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar', role: 'destructive',
          handler: async () => {
            const loading = await this.loadingCtrl.create({ message: 'Eliminando...' });
            await loading.present();
            try {
              const salud = this.getSaludDeMascota(mascota.id);
              if (salud) await this.sheetsService.eliminarSalud(salud.id_salud);
              const vacunas = this.getVacunasDeMascota(mascota.id);
              for (const vac of vacunas) await this.sheetsService.eliminarVacuna(vac.id_vacuna);
              await this.sheetsService.eliminarMascota(mascota.id);
              this.mascotas       = this.mascotas.filter(m => m.id !== mascota.id);
              this.registrosSalud = this.registrosSalud.filter(s => String(s.id_persona) !== String(mascota.id));
              this.todasVacunas   = this.todasVacunas.filter(v => String(v.id_persona) !== String(mascota.id));
              await loading.dismiss();
              this.mostrarToast('🗑️ Mascota eliminada', 'success');
            } catch {
              await loading.dismiss();
              this.mostrarToast('❌ Error al eliminar', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SALUD
  // ══════════════════════════════════════════════════════════════════════════

  abrirModalSalud(mascota: Mascota) {
    this.mascotaSeleccionadaParaSalud = mascota;
    const saludExistente = this.getSaludDeMascota(mascota.id);
    if (saludExistente) {
      this.editandoSaludId = saludExistente.id_salud;
      this.formSalud.patchValue({
        peso: saludExistente.peso, talla: saludExistente.talla,
        enfermedades: saludExistente.enfermedades
      });
    } else {
      this.editandoSaludId = null;
      this.formSalud.reset();
    }
    this.modalSalud?.present();
  }

  cancelarSalud() {
    this.editandoSaludId = null;
    this.mascotaSeleccionadaParaSalud = null;
    this.formSalud.reset();
    this.modalSalud?.dismiss();
  }

  async guardarSalud() {
    if (this.formSalud.invalid) { this.formSalud.markAllAsTouched(); return; }
    if (!this.mascotaSeleccionadaParaSalud) return;

    const esEdicion = !!this.editandoSaludId;
    const loading = await this.loadingCtrl.create({
      message: esEdicion ? 'Actualizando salud...' : 'Guardando salud...'
    });
    await loading.present();

    const salud: Salud = {
      id_salud:      this.editandoSaludId || Date.now().toString(),
      id_persona:    this.mascotaSeleccionadaParaSalud.id,
      ...this.formSalud.value,
      fechaRegistro: new Date().toLocaleDateString('es-ES')
    };

    try {
      await this.sheetsService.guardarSalud(salud, esEdicion ? 'UPDATE' : 'CREATE');
      await loading.dismiss();
      this.cancelarSalud();
      this.mostrarToast(esEdicion ? '✏️ Salud actualizada' : '💊 Datos de salud guardados', 'success');
      setTimeout(() => this.cargarDatos(), 1500);
    } catch {
      await loading.dismiss();
      this.mostrarToast('❌ Error al guardar salud', 'danger');
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VACUNAS
  // ══════════════════════════════════════════════════════════════════════════

  abrirModalVacunas(mascota: Mascota) {
    this.mascotaSeleccionadaParaVacunas = mascota;
    this.modalVacunas?.present();
  }

  cerrarModalVacunas() {
    this.mascotaSeleccionadaParaVacunas = null;
    this.modalVacunas?.dismiss();
  }

  abrirFormularioVacuna(vacuna?: Vacuna) {
    if (vacuna) {
      this.editandoVacunaId = vacuna.id_vacuna;
      this.formVacuna.patchValue({
        tipo_vacuna:      vacuna.tipo_vacuna,
        fecha_aplicacion: this.aFormatoInput(vacuna.fecha_aplicacion),
        proxima_dosis:    this.aFormatoInput(vacuna.proxima_dosis),
        observaciones:    vacuna.observaciones,
        peso:             vacuna.peso
      });
    } else {
      this.editandoVacunaId = null;
      this.formVacuna.reset();
    }
    this.modalVacuna?.present();
  }

  cancelarVacuna() {
    this.editandoVacunaId = null;
    this.formVacuna.reset();
    this.modalVacuna?.dismiss();
  }

  async guardarVacuna() {
    if (this.formVacuna.invalid) { this.formVacuna.markAllAsTouched(); return; }
    if (!this.mascotaSeleccionadaParaVacunas) return;

    const esEdicion = !!this.editandoVacunaId;
    const loading = await this.loadingCtrl.create({
      message: esEdicion ? 'Actualizando vacuna...' : 'Guardando vacuna...'
    });
    await loading.present();

    const val = this.formVacuna.value;
    const vacuna: Vacuna = {
      id_vacuna:        this.editandoVacunaId || Date.now().toString(),
      id_persona:       this.mascotaSeleccionadaParaVacunas.id,
      tipo_vacuna:      val.tipo_vacuna,
      fecha_aplicacion: this.aFormatoSheet(val.fecha_aplicacion),
      proxima_dosis:    this.aFormatoSheet(val.proxima_dosis),
      observaciones:    val.observaciones,
      peso:             val.peso,
      fechaRegistro:    new Date().toLocaleDateString('es-ES')
    };

    try {
      await this.sheetsService.guardarVacuna(vacuna, esEdicion ? 'UPDATE' : 'CREATE');
      await loading.dismiss();
      this.cancelarVacuna();
      this.mostrarToast(esEdicion ? '✏️ Vacuna actualizada' : '💉 Vacuna registrada', 'success');
      setTimeout(() => this.cargarVacunas(), 1500);
    } catch {
      await loading.dismiss();
      this.mostrarToast('❌ Error al guardar vacuna', 'danger');
    }
  }

  async eliminarVacuna(vacuna: Vacuna) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar vacuna',
      message: `¿Eliminar el registro de "${vacuna.tipo_vacuna}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar', role: 'destructive',
          handler: async () => {
            const loading = await this.loadingCtrl.create({ message: 'Eliminando...' });
            await loading.present();
            try {
              await this.sheetsService.eliminarVacuna(vacuna.id_vacuna);
              this.todasVacunas = this.todasVacunas.filter(v => v.id_vacuna !== vacuna.id_vacuna);
              await loading.dismiss();
              this.mostrarToast('🗑️ Vacuna eliminada', 'success');
            } catch {
              await loading.dismiss();
              this.mostrarToast('❌ Error al eliminar vacuna', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }
}
