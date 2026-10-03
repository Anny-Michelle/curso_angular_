import {
  afterNextRender,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  signal,
  viewChild,
} from '@angular/core';
import {
  FormField,
  form,
  maxLength,
  minLength,
  required,
  validate,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { LIMITES, Prioridad } from '../../modelos/actividad';
import { ActividadesService } from '../actividades';

interface DatosActividad {
  titulo: string;
  descripcion: string;
  prioridad: Prioridad;
}

const VACIO: DatosActividad = { titulo: '', descripcion: '', prioridad: 'media' };

@Component({
  selector: 'app-formulario-actividad',
  imports: [FormField, RouterLink],
  templateUrl: './formulario-actividad.html',
  styleUrl: './formulario-actividad.css',
})
export class FormularioActividad {
  private readonly servicio = inject(ActividadesService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly resumen = viewChild<ElementRef<HTMLElement>>('resumen');
  private readonly tituloInput = viewChild<ElementRef<HTMLInputElement>>('tituloInput');

  readonly id = input<string>();

  protected readonly modelo = signal<DatosActividad>({ ...VACIO });
  protected readonly original = signal<DatosActividad>({ ...VACIO });
  protected readonly f = form(this.modelo, (campo) => {
    required(campo.titulo, { message: 'El título es obligatorio.' });
    minLength(campo.titulo, LIMITES.tituloMin, {
      message: `El título necesita al menos ${LIMITES.tituloMin} caracteres.`,
    });
    maxLength(campo.titulo, LIMITES.tituloMax, {
      message: `El título no puede pasar de ${LIMITES.tituloMax} caracteres.`,
    });
    validate(campo.titulo, ({ value }) =>
      value().length > 0 && value().trim().length === 0
        ? { kind: 'soloEspacios', message: 'El título no puede ser solo espacios.' }
        : null,
    );
    maxLength(campo.descripcion, LIMITES.descripcionMax, {
      message: `La descripción no puede pasar de ${LIMITES.descripcionMax} caracteres.`,
    });
  });

  protected readonly editando = computed(() => this.id() !== undefined);
  protected readonly titulo = computed(() => this.editando() ? 'Editar actividad' : 'Nueva actividad');
  protected readonly textoBoton = computed(() =>
    this.editando() ? 'Guardar cambios' : 'Crear actividad',
  );
  protected readonly restantes = computed(
    () => LIMITES.descripcionMax - this.modelo().descripcion.length,
  );
  protected readonly erroresTitulo = computed(() =>
    this.f.titulo().touched() ? this.f.titulo().errors().map((error) => error.message ?? '') : [],
  );
  protected readonly erroresDescripcion = computed(() =>
    this.f.descripcion().touched()
      ? this.f.descripcion().errors().map((error) => error.message ?? '')
      : [],
  );
  protected readonly resumenErrores = computed(() => [
    ...this.f.titulo().errors(),
    ...this.f.descripcion().errors(),
  ]);
  readonly tieneCambios = computed(() => {
    const actual = this.modelo();
    const inicial = this.original();
    return actual.titulo !== inicial.titulo ||
      actual.descripcion !== inicial.descripcion ||
      actual.prioridad !== inicial.prioridad;
  });
  protected readonly intentado = signal(false);
  protected readonly enviando = signal(false);
  protected readonly errorEnvio = signal('');

  constructor() {
    effect(() => {
      const id = this.id();
      if (id === undefined) {
        this.modelo.set({ ...VACIO });
        this.original.set({ ...VACIO });
        return;
      }

      const numero = this.idNumerico(id);
      const actividad = numero === null ? undefined : this.servicio.buscarPorId(numero);
      const datos: DatosActividad = actividad
        ? {
            titulo: actividad.titulo,
            descripcion: actividad.descripcion,
            prioridad: actividad.prioridad,
          }
        : { ...VACIO };
      this.modelo.set({ ...datos });
      this.original.set({ ...datos });
    });
  }

  protected async enviar(evento: Event): Promise<void> {
    evento.preventDefault();
    if (this.enviando()) return;

    this.errorEnvio.set('');
    this.intentado.set(true);
    this.f().markAsTouched();

    if (!this.f().valid()) {
      afterNextRender(() => this.resumen()?.nativeElement.focus(), {
        injector: this.injector,
      });
      return;
    }

    const { titulo, descripcion, prioridad } = this.modelo();
    const id = this.id();
    const numero = id === undefined ? null : this.idNumerico(id);

    if (id !== undefined && (numero === null || !this.servicio.buscarPorId(numero))) {
      this.errorEnvio.set('La actividad que intentas editar ya no existe. Vuelve a la lista.');
      return;
    }

    if (this.servicio.existeTitulo(titulo, numero)) {
      this.errorEnvio.set(
        `Ya existe ${id === undefined ? 'una actividad' : 'otra actividad'} con ese título. Cámbialo para continuar.`,
      );
      this.f.titulo().markAsTouched();
      this.tituloInput()?.nativeElement.focus();
      return;
    }

    this.enviando.set(true);
    try {
      if (id === undefined) {
        const creada = this.servicio.crear(titulo, descripcion, prioridad);
        if (!creada) {
          this.errorEnvio.set('No se pudo crear la actividad. Revisa los datos e inténtalo otra vez.');
          return;
        }
        this.original.set({ titulo, descripcion, prioridad });
        await this.router.navigate(['/actividades', creada.id], { replaceUrl: true });
        return;
      }

      if (numero === null || !this.servicio.actualizar(numero, titulo, descripcion, prioridad)) {
        this.errorEnvio.set('No se pudo guardar. Comprueba el título y vuelve a intentarlo.');
        return;
      }

      this.original.set({ titulo, descripcion, prioridad });
      await this.router.navigate(['/actividades', numero], { replaceUrl: true });
    } finally {
      this.enviando.set(false);
    }
  }

  protected restablecer(): void {
    this.modelo.set({ ...this.original() });
    this.errorEnvio.set('');
  }

  private idNumerico(valor: string): number | null {
    if (!/^[1-9]\d*$/.test(valor)) return null;
    const numero = Number(valor);
    return Number.isSafeInteger(numero) ? numero : null;
  }
}
