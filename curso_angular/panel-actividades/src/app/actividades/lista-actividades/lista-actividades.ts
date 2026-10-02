import { Component, ElementRef, input, output, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Actividad } from '../../modelos/actividad';
import { TarjetaActividad } from '../tarjeta-actividad/tarjeta-actividad';

@Component({
  selector: 'app-lista-actividades',
  imports: [TarjetaActividad, RouterLink],
  templateUrl: './lista-actividades.html',
  styleUrl: './lista-actividades.css'
})
export class ListaActividades {
  readonly actividades = input.required<Actividad[]>();
  readonly seleccionadaId = input<number | null>(null);
  readonly mensajeVacio = input('No hay nada que mostrar.');
  readonly hayFiltros = input(false);

  readonly seleccionCambiada = output<number>();
  readonly destacadoCambiado = output<number>();
  readonly avanceSolicitado = output<number>();
  readonly eliminacionSolicitada = output<number>();
  readonly limpiezaSolicitada = output<void>();

  private readonly lista = viewChild.required<ElementRef<HTMLUListElement>>('lista');

  protected solicitarEliminacion(id: number): void {
    this.eliminacionSolicitada.emit(id);
    this.lista().nativeElement.focus();
  }
}