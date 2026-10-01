import { Component, computed, effect, signal } from '@angular/core';
import { Actividad, EstadoActividad, ETIQUETAS, FiltroEstado, FiltroPrioridad, Prioridad } from '../../modelos/actividad';
import { FiltrosActividades } from '../filtros-actividades/filtros-actividades';
import { ListaActividades } from '../lista-actividades/lista-actividades';
import { ResumenActividades } from '../resumen-actividades/resumen-actividades';
import { PanelSeccion } from '../../compartido/panel-seccion/panel-seccion';

@Component({
  selector: 'app-pagina-actividades',
  imports: [PanelSeccion, ResumenActividades, FiltrosActividades, ListaActividades],
  templateUrl: './pagina-actividades.html',
  styleUrl: './pagina-actividades.css',
})
export class PaginaActividades {
  private readonly orden: Record<Prioridad, number> = { alta: 0, media: 1, baja: 2 };

  protected readonly actividades = signal<Actividad[]>([
    { id: 1, titulo: 'Resolver ecuaciones de primer grado', estado: 'completada', prioridad: 'alta', creadaEn: '2026-08-10', destacada: false },
    { id: 2, titulo: 'Revisar funciones trigonométricas', estado: 'en_progreso', prioridad: 'media', creadaEn: '2026-08-12', destacada: true },
    { id: 3, titulo: 'Practicar geometría analítica', estado: 'pendiente', prioridad: 'alta', creadaEn: '2026-08-14', destacada: false },
    { id: 4, titulo: 'Repasar teorema de Pitágoras', estado: 'pendiente', prioridad: 'baja', creadaEn: '2026-08-16', destacada: false },
    { id: 5, titulo: 'Simular examen de álgebra', estado: 'pendiente', prioridad: 'media', creadaEn: '2026-08-18', destacada: false },
  ]);

  protected readonly termino = signal('');
  protected readonly filtroEstado = signal<FiltroEstado>('todas');
  protected readonly filtroPrioridad = signal<FiltroPrioridad>('todas');
  protected readonly seleccionadaId = signal<number | null>(null);
  protected readonly ultimoAviso = signal('');

  protected readonly total = computed(() => this.actividades().length);
  protected readonly pendientes = computed(() => this.actividades().filter((a) => a.estado === 'pendiente').length);
  protected readonly enProgreso = computed(() => this.actividades().filter((a) => a.estado === 'en_progreso').length);
  protected readonly completadas = computed(() => this.actividades().filter((a) => a.estado === 'completada').length);
  protected readonly porcentaje = computed(() => this.total() === 0 ? 0 : Math.round((this.completadas() / this.total()) * 100));

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
    const actividad = this.actividades().find((a) => a.id === id);
    if (!actividad) return;

    this.actividades.update((actuales) =>
      actuales.map((a) => a.id === id ? { ...a, destacada: !a.destacada } : a),
    );
    this.ultimoAviso.set(
      `${actividad.titulo}: ${actividad.destacada ? 'se quitó de destacadas' : 'marcada como destacada'}.`,
    );
  }

  protected avanzarEstado(id: number): void {
    const actividad = this.actividades().find((a) => a.id === id);
    if (!actividad || actividad.estado === 'completada') return;

    const siguiente = this.siguienteEstado(actividad.estado);
    this.actividades.update((actuales) =>
      actuales.map((a) => a.id === id ? { ...a, estado: siguiente } : a),
    );
    this.ultimoAviso.set(`${actividad.titulo}: ${ETIQUETAS[siguiente]}.`);
  }

  protected seleccionar(id: number): void {
    const seleccionada = this.seleccionadaId() !== id;
    this.seleccionadaId.set(seleccionada ? id : null);
    const actividad = this.actividades().find((a) => a.id === id);
    if (actividad) {
      this.ultimoAviso.set(`${actividad.titulo}: ${seleccionada ? 'seleccionada' : 'selección quitada'}.`);
    }
  }

  protected eliminar(id: number): void {
    const actividad = this.actividades().find((a) => a.id === id);
    this.actividades.update((actuales) => actuales.filter((a) => a.id !== id));
    this.seleccionadaId.update((actual) => actual === id ? null : actual);
    if (actividad) this.ultimoAviso.set(`Actividad eliminada: ${actividad.titulo}.`);
  }

  protected limpiarFiltros(): void {
    this.termino.set('');
    this.filtroEstado.set('todas');
    this.filtroPrioridad.set('todas');
    this.ultimoAviso.set('Filtros eliminados. Se muestran todas las actividades.');
  }

  protected restablecer(): void {
    this.actividades.set([]);
    this.limpiarFiltros();
    this.seleccionadaId.set(null);
    this.ultimoAviso.set('Tablero vacío. Ya no quedan actividades.');
  }

  private siguienteEstado(estado: EstadoActividad): EstadoActividad {
    if (estado === 'pendiente') return 'en_progreso';
    if (estado === 'en_progreso') return 'completada';
    return 'completada';
  }
}