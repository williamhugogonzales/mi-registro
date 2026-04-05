import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { SheetsService } from '../services/sheets.service';
import { Persona } from '../models/persona.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage implements OnInit {
  formulario!: FormGroup;
  personas: Persona[] = [];
  cargando = false;

  constructor(
    private fb: FormBuilder,
    private sheetsService: SheetsService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit() {
    this.formulario = this.fb.group({
      nombre:       ['', [Validators.required, Validators.minLength(2)]],
      edad:         ['', [Validators.required, Validators.min(1), Validators.max(120)]],
      nacionalidad: ['', Validators.required],
      sexo:         ['', Validators.required]
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
      await this.sheetsService.guardarFetch(persona);
      this.formulario.reset();
      this.mostrarToast('✅ Guardado en Google Sheets', 'success');
    } catch (error) {
      this.mostrarToast('❌ Error al guardar', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2500,
      color: color,
      position: 'top'
    });
    toast.present();
  }

  esInvalido(campo: string): boolean {
    const ctrl = this.formulario.get(campo);
    return !!(ctrl?.invalid && ctrl?.touched);
  }
}