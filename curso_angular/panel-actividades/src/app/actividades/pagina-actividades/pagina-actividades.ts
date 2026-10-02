import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ETIQUETAS, FiltroEstado, FiltroPrioridad, Prioridad } from '../../modelos/actividad';
import { FiltrosActividades } from '../filtros-actividades/filtros-actividades';
import { ListaActividades } from '../lista-actividades/lista-actividades';
import { ResumenActividades } from '../resumen-actividades/resumen-actividades';
import { PanelSeccion } from '../../compartido/panel-seccion/panel-seccion';
import { ActividadesService } from '../actividades';

@Component({
  selector: 'app-pagina-actividades',
  imports: [PanelSeccion, ResumenActividades, FiltrosActividades, ListaActividades],
  templateUrl: './pagina-actividades.html',
  styleUrl: './pagina-actividades.css',
})
export class PaginaActividades {
  private readonly servicio = inject(ActividadesService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  private readonly orden: Record<Prioridad, number> = { alta: 0, media: 1, baja: 2 };

  protected readonly actividades = this.servicio.actividades;
  protected readonly aviso = this.servicio.aviso;
  protected readonly sinGuardar = this.servicio.sinGuardar;

  readonly buscar = input<string | undefined>('');
  readonly estado = input<string | undefined>('todas');
  readonly prioridad = input<string | undefined>('todas');

  protected readonly termino = computed(() => this.buscar() ?? '');
  protected readonly filtroEstado = computed<FiltroEstado>(() => {
    const valor = this.estado();
    return valor === 'pendiente' || valor === 'en_progreso' || valor === 'completada' ? valor : 'todas';
  });
  protected readonly filtroPrioridad = computed<FiltroPrioridad>(() => {
    const valor = this.prioridad();
    return valor === 'alta' || valor === 'media' || valor === 'baja' ? valor : 'todas';
  });
  protected readonly seleccionadaId = signal<number | null>(null);
  protected readonly ultimoAviso = signal('');

  protected readonly total = this.servicio.total;
  protected readonly pendientes = this.servicio.pendientes;
  protected readonly enProgreso = this.servicio.enProgreso;
  protected readonly completadas = this.servicio.completadas;
  protected readonly porcentaje = this.servicio.porcentaje;

  protected readonly visibles = computed(() => {
    const termino = this.termino().trim().toLocaleLowerCase('es');
    const estado = this.filtroEstado();
    const prioridad = this.filtroPrioridad();

    return [...this.actividades()]
      .filter((a) => termino === '' || a.titulo.toLocaleLowerCase('es').includes(termino))
      .filter((a) => estado === 'todas' || a.estado === estado)
      .filter((a) => prioridad === 'todas' || a.prioridad === prioridad)
      .sort((primera, segunda) => this.orden[primera.prioridad] - this.orden[segunda.prioridad]);
  });

  protected readonly mostradas = computed(() => this.visibles().length);
  protected readonly hayFiltros = computed(() =>
    this.termino().trim() !== '' || this.filtroEstado() !== 'todas' || this.filtroPrioridad() !== 'todas',
  );
  protected readonly mensajeVacio = computed(() =>
    this.total() === 0
      ? 'Todavía no hay actividades. Crea la primera para empezar.'
      : 'Ninguna actividad coincide con los filtros aplicados.',
  );
  protected readonly seleccionada = computed(
    () => this.actividades().find((a) => a.id === this.seleccionadaId()) ?? null,
  );

  constructor() {
    effect(() => {
      console.info(`[Tablero] ${this.mostradas()} de ${this.total()} visibles`);
    });
  }

  protected alternarDestacada(id: number): void {
    const actividad = this.servicio.buscarPorId(id);
    if (!actividad) return;

    this.servicio.alternarDestacada(id);
    this.ultimoAviso.set(
      `${actividad.titulo}: ${actividad.destacada ? 'se quitó de destacadas' : 'marcada como destacada'}.`,
    );
  }

  protected avanzarEstado(id: number): void {
    const actividad = this.servicio.buscarPorId(id);
    if (!actividad || actividad.estado === 'completada') return;

    const siguiente = this.servicio.avanzarEstado(id);
    if (!siguiente) return;
    this.ultimoAviso.set(`${actividad.titulo}: ${ETIQUETAS[siguiente]}.`);
  }

  protected seleccionar(id: number): void {
    const seleccionada = this.seleccionadaId() !== id;
    this.seleccionadaId.set(seleccionada ? id : null);
    const actividad = this.servicio.buscarPorId(id);
    if (actividad) {
      this.ultimoAviso.set(`${actividad.titulo}: ${seleccionada ? 'seleccionada' : 'selección quitada'}.`);
    }
  }

  protected eliminar(id: number): void {
    const actividad = this.servicio.buscarPorId(id);
    this.servicio.eliminar(id);
    this.seleccionadaId.update((actual) => actual === id ? null : actual);
    if (actividad) this.ultimoAviso.set(`Actividad eliminada: ${actividad.titulo}.`);
  }

  protected cambiarBuscar(valor: string): void {
    this.actualizar({ buscar: valor.trim() === '' ? null : valor });
  }

  protected cambiarEstado(valor: FiltroEstado): void {
    this.actualizar({ estado: valor === 'todas' ? null : valor });
  }

  protected cambiarPrioridad(valor: FiltroPrioridad): void {
    this.actualizar({ prioridad: valor === 'todas' ? null : valor });
  }

  protected limpiarFiltros(): void {
    this.actualizar({ buscar: null, estado: null, prioridad: null });
    this.ultimoAviso.set('Filtros eliminados. Se muestran todas las actividades.');
  }

  protected restablecer(): void {
    this.servicio.vaciar();
    this.limpiarFiltros();
    this.seleccionadaId.set(null);
    this.ultimoAviso.set('Tablero vacío. Ya no quedan actividades.');
  }

  private actualizar(cambios: Record<string, string | null>): void {
    void this.router.navigate([], {
      relativeTo: this.ruta,
      queryParams: cambios,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

}