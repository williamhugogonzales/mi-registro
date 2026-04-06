import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
  IonButton, IonIcon, IonList, IonNote, IonButtons,
  ToastController, LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { saveOutline, refreshOutline, trashOutline, peopleOutline } from 'ionicons/icons';
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
    IonButton, IonIcon, IonList, IonNote, IonButtons
  ],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage implements OnInit {
  formulario!: FormGroup;
  personas: Persona[] = [];
  cargandoDatos = false;

  constructor(
    private fb: FormBuilder,
    private sheetsService: SheetsService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {
    addIcons({ saveOutline, refreshOutline, trashOutline, peopleOutline });
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

  async guardar() {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Guardando...' });
    await loading.present();

    const persona: Persona = {
      id: Date.now().toString(),
      ...this.formulario.value,
      fechaRegistro: new Date().toLocaleDateString('es-ES')
    };

    try {
      // Intenta con HttpClient (funciona en APK)
      this.sheetsService.guardar(persona).subscribe({
        next: async () => {
  await loading.dismiss();
  this.formulario.reset();
  this.mostrarToast('✅ Guardado en Google Sheets', 'success');
  // Recarga la lista después de que desaparezca el toast (3 segundos)
  setTimeout(() => this.cargarPersonas(), 3000);
},
        error: async () => {
          // Si falla por CORS (web), usa guardarFetch
          try {
            await this.sheetsService.guardarFetch(persona);
            await loading.dismiss();
            this.formulario.reset();
            this.mostrarToast('✅ Guardado en Google Sheets', 'success');
            // Recarga la lista después de que desaparezca el toast (3 segundos)
            setTimeout(() => this.cargarPersonas(), 3000);
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