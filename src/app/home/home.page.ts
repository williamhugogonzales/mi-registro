import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
  IonButton, IonIcon, IonList, IonNote, IonButtons,
  ToastController, LoadingController, AlertController, IonModal, IonFab, IonFabButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { saveOutline, refreshOutline, trashOutline, peopleOutline, createOutline, closeOutline, addOutline } from 'ionicons/icons';
import { SheetsService } from '../services/sheets.service';
import { Persona } from '../models/persona.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
    IonButton, IonIcon, IonList, IonNote, IonButtons, IonModal, IonFab, IonFabButton
  ],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage implements OnInit {
  @ViewChild('modalEditar') modalEditar: IonModal | null = null;
  
  formulario!: FormGroup;
  personas: Persona[] = [];
  cargandoDatos = false;
  editandoId: string | null = null;
  personaEditando: Persona | null = null;

  constructor(
    private fb: FormBuilder,
    private sheetsService: SheetsService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) {
    addIcons({ saveOutline, refreshOutline, trashOutline, peopleOutline, createOutline, closeOutline, addOutline });
  }

  ngOnInit() {
    this.formulario = this.fb.group({
      nombre:       ['', [Validators.required, Validators.minLength(2)]],
      edad:         ['', [Validators.required, Validators.min(1), Validators.max(120)]],
      nacionalidad: ['', Validators.required],
      sexo:         ['', Validators.required]
    });
    this.cargarPersonas();
  }

  cargarPersonas() {
    this.cargandoDatos = true;
    this.sheetsService.obtenerTodos().subscribe({
      next: (datos) => {
        this.personas = datos;
        this.cargandoDatos = false;
      },
      error: () => {
        this.mostrarToast('❌ Error al cargar datos', 'danger');
        this.cargandoDatos = false;
      }
    });
  }

  actualizarListaLocalEliminada(id: string) {
    this.personas = this.personas.filter(p => p.id !== id);
  }

  trackById(index: number, persona: Persona) {
    return persona.id;
  }

  async guardar() {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const loading = await this.loadingCtrl.create({ message: this.editandoId ? 'Actualizando...' : 'Guardando...' });
    await loading.present();

    const esEdicion = !!this.editandoId;
    const accion = esEdicion ? 'UPDATE' : 'CREATE';
    const persona: Persona = {
      id: this.editandoId || Date.now().toString(),
      ...this.formulario.value,
      fechaRegistro: this.personaEditando?.fechaRegistro || new Date().toLocaleDateString('es-ES')
    };

    try {
      // Intenta con HttpClient (funciona en APK)
      this.sheetsService.guardar(persona, accion).subscribe({
        next: async () => {
  await loading.dismiss();
  this.formulario.reset();
  this.editandoId = null;
  this.personaEditando = null;
  this.modalEditar?.dismiss();
  const mensaje = esEdicion ? '✏️ Registro actualizado' : '✅ Guardado en Google Sheets';
  this.mostrarToast(mensaje, 'success');
  this.cargarPersonas();
},
        error: async () => {
          // Si falla por CORS (web), usa guardarFetch
          try {
            await this.sheetsService.guardarFetch(persona, accion);
            await loading.dismiss();
            this.formulario.reset();
            this.editandoId = null;
            this.personaEditando = null;
            this.modalEditar?.dismiss();
            const mensaje = esEdicion ? '✏️ Registro actualizado' : '✅ Guardado en Google Sheets';
            this.mostrarToast(mensaje, 'success');
            this.cargarPersonas();
          } catch (e) {
            await loading.dismiss();
            this.mostrarToast('❌ Error al guardar', 'danger');
          }
        }
      });
    } catch (error) {
      await loading.dismiss();
      this.mostrarToast('❌ Error al guardar', 'danger');
    }
  }

  editar(persona: Persona) {
    this.editandoId = persona.id;
    this.personaEditando = persona;
    this.formulario.patchValue({
      nombre: persona.nombre,
      edad: persona.edad,
      nacionalidad: persona.nacionalidad,
      sexo: persona.sexo
    });
    // Abre el modal
    this.modalEditar?.present();
  }

  nuevoRegistro() {
    this.editandoId = null;
    this.personaEditando = null;
    this.formulario.reset();
    this.modalEditar?.present();
  }

  cancelarEdicion() {
    this.editandoId = null;
    this.personaEditando = null;
    this.formulario.reset();
    this.modalEditar?.dismiss();
  }

  async eliminar(persona: Persona) {
    console.log('Intentando eliminar persona:', persona);
    console.log('ID de la persona:', persona.id);

    const alert = await this.alertCtrl.create({
      header: 'Eliminar registro',
      message: `¿Estás seguro de que deseas eliminar a ${persona.nombre}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            const loading = await this.loadingCtrl.create({ message: 'Eliminando...' });
            await loading.present();

            try {
              // Intenta con HttpClient (funciona en APK)
              this.sheetsService.eliminarHttp(persona.id).subscribe({
                next: async () => {
                  console.log('Eliminación exitosa con HttpClient');
                  this.actualizarListaLocalEliminada(persona.id);
                  await loading.dismiss();
                  this.mostrarToast('🗑️ Registro eliminado', 'success');
                  this.cargarPersonas();
                },
                error: async () => {
                  // Si falla por CORS (web), usa eliminar fetch
                  try {
                    await this.sheetsService.eliminar(persona.id);
                    console.log('Eliminación exitosa con fetch');
                    this.actualizarListaLocalEliminada(persona.id);
                    await loading.dismiss();
                    this.mostrarToast('🗑️ Registro eliminado', 'success');
                    this.cargarPersonas();
                  } catch (e) {
                    console.log('Error en eliminación fetch:', e);
                    await loading.dismiss();
                    this.mostrarToast('❌ Error al eliminar', 'danger');
                  }
                }
              });
            } catch (error) {
              console.log('Error general en eliminación:', error);
              await loading.dismiss();
              this.mostrarToast('❌ Error al eliminar', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
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

  esInvalido(campo: string): boolean {
    const ctrl = this.formulario.get(campo);
    return !!(ctrl?.invalid && ctrl?.touched);
  }
}