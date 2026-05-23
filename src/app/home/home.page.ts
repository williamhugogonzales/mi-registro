import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
  IonButton, IonIcon, IonList, IonNote, IonButtons,
  ToastController, LoadingController, AlertController, IonModal, IonFab, IonFabButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  saveOutline, refreshOutline, trashOutline, peopleOutline,
  createOutline, closeOutline, addOutline, heartOutline,
  medkitOutline, chevronDownOutline
} from 'ionicons/icons';
import { SheetsService } from '../services/sheets.service';
import { Persona } from '../models/persona.model';
import { Salud } from '../models/salud.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
    IonButton, IonIcon, IonList, IonNote, IonButtons,
    IonModal, IonFab, IonFabButton
  ],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage implements OnInit {
  @ViewChild('modalPersona') modalPersona: IonModal | null = null;
  @ViewChild('modalSalud') modalSalud: IonModal | null = null;

  // ─── Formularios ──────────────────────────────────────────────────────────
  formPersona!: FormGroup;
  formSalud!: FormGroup;

  // ─── Datos ────────────────────────────────────────────────────────────────
  personas: Persona[] = [];
  registrosSalud: Salud[] = [];
  cargandoDatos = false;

  // ─── Estado edición persona ───────────────────────────────────────────────
  editandoPersonaId: string | null = null;
  personaEditando: Persona | null = null;

  // ─── Estado edición salud ─────────────────────────────────────────────────
  editandoSaludId: string | null = null;
  personaSeleccionadaParaSalud: Persona | null = null;

  constructor(
    private fb: FormBuilder,
    private sheetsService: SheetsService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) {
    addIcons({
      saveOutline, refreshOutline, trashOutline, peopleOutline,
      createOutline, closeOutline, addOutline, heartOutline,
      medkitOutline, chevronDownOutline
    });
  }

  ngOnInit() {
    this.formPersona = this.fb.group({
      nombre:       new FormControl('', [Validators.required, Validators.minLength(2)]),
      edad:         new FormControl('', [Validators.required, Validators.min(1), Validators.max(120)]),
      nacionalidad: new FormControl('', Validators.required),
      sexo:         new FormControl('', Validators.required)
    });

    this.formSalud = this.fb.group({
      peso:         new FormControl('', [Validators.required, Validators.min(1), Validators.max(500)]),
      talla:        new FormControl('', [Validators.required, Validators.min(30), Validators.max(250)]),
      enfermedades: new FormControl('', Validators.required)
    });

    this.cargarDatos();
  }

  // ─── Getters tipados para el template ─────────────────────────────────────
  get nombreCtrl()       { return this.formPersona.get('nombre') as FormControl; }
  get edadCtrl()         { return this.formPersona.get('edad') as FormControl; }
  get nacionalidadCtrl() { return this.formPersona.get('nacionalidad') as FormControl; }
  get sexoCtrl()         { return this.formPersona.get('sexo') as FormControl; }
  get pesoCtrl()         { return this.formSalud.get('peso') as FormControl; }
  get tallaCtrl()        { return this.formSalud.get('talla') as FormControl; }
  get enfermedadesCtrl() { return this.formSalud.get('enfermedades') as FormControl; }

  // ─── CARGAR DATOS ─────────────────────────────────────────────────────────
  cargarDatos() {
    this.cargandoDatos = true;
    this.sheetsService.obtenerPersonas().subscribe({
      next: (datos) => {
        this.personas = datos;
        this.cargarSalud();
      },
      error: () => {
        this.mostrarToast('❌ Error al cargar personas', 'danger');
        this.cargandoDatos = false;
      }
    });
  }

  cargarSalud() {
    this.sheetsService.obtenerSalud().subscribe({
      next: (datos) => {
        this.registrosSalud = datos;
        this.cargandoDatos = false;
      },
      error: () => {
        this.cargandoDatos = false;
      }
    });
  }

  // ─── OBTENER SALUD DE UNA PERSONA ─────────────────────────────────────────
  getSaludDePersona(idPersona: string): Salud | null {
    return this.registrosSalud.find(s => String(s.id_persona) === String(idPersona)) || null;
  }

  // ─── MODAL PERSONA ────────────────────────────────────────────────────────
  abrirModalNuevaPersona() {
    this.editandoPersonaId = null;
    this.personaEditando = null;
    this.formPersona.reset();
    this.modalPersona?.present();
  }

  editarPersona(persona: Persona) {
    this.editandoPersonaId = persona.id;
    this.personaEditando = persona;
    this.formPersona.patchValue({
      nombre:       persona.nombre,
      edad:         persona.edad,
      nacionalidad: persona.nacionalidad,
      sexo:         persona.sexo
    });
    this.modalPersona?.present();
  }

  cancelarPersona() {
    this.editandoPersonaId = null;
    this.personaEditando = null;
    this.formPersona.reset();
    this.modalPersona?.dismiss();
  }

  // ─── GUARDAR PERSONA ──────────────────────────────────────────────────────
  async guardarPersona() {
    if (this.formPersona.invalid) {
      this.formPersona.markAllAsTouched();
      return;
    }

    const esEdicion = !!this.editandoPersonaId;
    const loading = await this.loadingCtrl.create({
      message: esEdicion ? 'Actualizando...' : 'Guardando...'
    });
    await loading.present();

    const persona: Persona = {
      id: this.editandoPersonaId || Date.now().toString(),
      ...this.formPersona.value,
      fechaRegistro: this.personaEditando?.fechaRegistro || new Date().toLocaleDateString('es-ES')
    };

    try {
      await this.sheetsService.guardarPersona(persona, esEdicion ? 'UPDATE' : 'CREATE');
      await loading.dismiss();
      this.cancelarPersona();
      this.mostrarToast(esEdicion ? '✏️ Persona actualizada' : '✅ Persona registrada', 'success');
      setTimeout(() => this.cargarDatos(), 1500);
    } catch {
      await loading.dismiss();
      this.mostrarToast('❌ Error al guardar persona', 'danger');
    }
  }

  // ─── ELIMINAR PERSONA ─────────────────────────────────────────────────────
  async eliminarPersona(persona: Persona) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar persona',
      message: `¿Eliminar a ${persona.nombre}? También se eliminarán sus datos de salud.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            const loading = await this.loadingCtrl.create({ message: 'Eliminando...' });
            await loading.present();
            try {
              const salud = this.getSaludDePersona(persona.id);
              if (salud) {
                await this.sheetsService.eliminarSalud(salud.id_salud);
              }
              await this.sheetsService.eliminarPersona(persona.id);
              this.personas = this.personas.filter(p => p.id !== persona.id);
              this.registrosSalud = this.registrosSalud.filter(s => String(s.id_persona) !== String(persona.id));
              await loading.dismiss();
              this.mostrarToast('🗑️ Persona eliminada', 'success');
              setTimeout(() => this.cargarDatos(), 1500);
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

  // ─── MODAL SALUD ──────────────────────────────────────────────────────────
  abrirModalSalud(persona: Persona) {
    this.personaSeleccionadaParaSalud = persona;
    const saludExistente = this.getSaludDePersona(persona.id);

    if (saludExistente) {
      this.editandoSaludId = saludExistente.id_salud;
      this.formSalud.patchValue({
        peso:         saludExistente.peso,
        talla:        saludExistente.talla,
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
    this.personaSeleccionadaParaSalud = null;
    this.formSalud.reset();
    this.modalSalud?.dismiss();
  }

  // ─── GUARDAR SALUD ────────────────────────────────────────────────────────
  async guardarSalud() {
    if (this.formSalud.invalid) {
      this.formSalud.markAllAsTouched();
      return;
    }
    if (!this.personaSeleccionadaParaSalud) return;

    const esEdicion = !!this.editandoSaludId;
    const loading = await this.loadingCtrl.create({
      message: esEdicion ? 'Actualizando salud...' : 'Guardando salud...'
    });
    await loading.present();

    const salud: Salud = {
      id_salud:      this.editandoSaludId || Date.now().toString(),
      id_persona:    this.personaSeleccionadaParaSalud.id,
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

  // ─── HELPERS ──────────────────────────────────────────────────────────────
  trackById(index: number, persona: Persona) {
    return persona.id;
  }

  esInvalidoPersona(campo: string): boolean {
    const ctrl = this.formPersona.get(campo);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  esInvalidoSalud(campo: string): boolean {
    const ctrl = this.formSalud.get(campo);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2500,
      color,
      position: 'top'
    });
    toast.present();
  }
}
