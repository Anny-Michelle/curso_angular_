import { Component, computed, input, output } from '@angular/core';
import type { Actividad } from '../../modelos/actividad';
import { ETIQUETAS } from '../../modelos/actividad';

@Component({
  selector: 'app-tarjeta-actividad',
  templateUrl: './tarjeta-actividad.html',
  styleUrl: './tarjeta-actividad.css'
})
export class TarjetaActividad {
  readonly actividad = input.required<Actividad>();
  readonly seleccionada = input(false);

  readonly seleccionCambiada = output<number>();
  readonly destacadoCambiado = output<number>();
  readonly avanceSolicitado = output<number>();
  readonly eliminacionSolicitada = output<number>();

  protected readonly etiquetaEstado = computed(
    () => ETIQUETAS[this.actividad().estado],
  );
  protected readonly etiquetaSeleccion = computed(
    () => `${this.seleccionada() ? 'Quitar selección' : 'Seleccionar'} ${this.actividad().titulo}`,
  );
  protected readonly etiquetaDestacado = computed(
    () => `${this.actividad().destacada ? 'Quitar destacado' : 'Destacar'} ${this.actividad().titulo}`,
  );
  protected readonly etiquetaAvance = computed(
    () => `Avanzar estado de ${this.actividad().titulo}`,
  );
  protected readonly etiquetaEliminar = computed(
    () => `Eliminar ${this.actividad().titulo}`,
  );
}