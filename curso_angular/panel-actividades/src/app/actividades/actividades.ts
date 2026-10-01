import { computed, inject, Service, signal } from '@angular/core';
import { AlmacenamientoService } from '../compartido/almacenamiento';
import { Actividad, EstadoActividad, esColeccionActividades } from '../modelos/actividad';

const CLAVE = 'panel.actividades.v1';

const INICIALES: readonly Actividad[] = [
  { id: 1, titulo: 'Resolver ecuaciones de primer grado', estado: 'completada', prioridad: 'alta', creadaEn: '2026-08-10', destacada: false },
  { id: 2, titulo: 'Revisar funciones trigonométricas', estado: 'en_progreso', prioridad: 'media', creadaEn: '2026-08-12', destacada: true },
  { id: 3, titulo: 'Practicar geometría analítica', estado: 'pendiente', prioridad: 'alta', creadaEn: '2026-08-14', destacada: false },
  { id: 4, titulo: 'Repasar teorema de Pitágoras', estado: 'pendiente', prioridad: 'baja', creadaEn: '2026-08-16', destacada: false },
  { id: 5, titulo: 'Simular examen de álgebra', estado: 'pendiente', prioridad: 'media', creadaEn: '2026-08-18', destacada: false },
];

function copiarIniciales(): Actividad[] {
  return INICIALES.map((actividad) => ({ ...actividad }));
}

@Service()
export class ActividadesService {
  private readonly almacen = inject(AlmacenamientoService);
  private readonly lista = signal<Actividad[]>(copiarIniciales());
  private readonly avisoInterno = signal('');
  private readonly sinGuardarInterno = signal(false);

  readonly actividades = this.lista.asReadonly();
  readonly aviso = this.avisoInterno.asReadonly();
  readonly sinGuardar = this.sinGuardarInterno.asReadonly();

  readonly total = computed(() => this.lista().length);
  readonly pendientes = computed(() => this.lista().filter((actividad) => actividad.estado === 'pendiente').length);
  readonly enProgreso = computed(() => this.lista().filter((actividad) => actividad.estado === 'en_progreso').length);
  readonly completadas = computed(() => this.lista().filter((actividad) => actividad.estado === 'completada').length);
  readonly porcentaje = computed(() => this.total() === 0 ? 0 : Math.round((this.completadas() / this.total()) * 100));

  constructor() {
    this.cargar();
    window.addEventListener('storage', (evento) => {
      if (evento.key === CLAVE) this.cargar();
    });
  }

  buscarPorId(id: number): Actividad | undefined {
    return this.lista().find((actividad) => actividad.id === id);
  }

  alternarDestacada(id: number): boolean {
    if (!this.buscarPorId(id)) return false;

    this.aplicar((actuales) =>
      actuales.map((actividad) => actividad.id === id
        ? { ...actividad, destacada: !actividad.destacada }
        : actividad),
    );
    return true;
  }

  avanzarEstado(id: number): EstadoActividad | null {
    const actividad = this.buscarPorId(id);
    if (!actividad || actividad.estado === 'completada') return null;

    const siguiente = this.siguienteEstado(actividad.estado);
    this.aplicar((actuales) =>
      actuales.map((actual) => actual.id === id
        ? { ...actual, estado: siguiente }
        : actual),
    );
    return siguiente;
  }

  eliminar(id: number): boolean {
    if (!this.buscarPorId(id)) return false;

    this.aplicar((actuales) => actuales.filter((actividad) => actividad.id !== id));
    return true;
  }

  vaciar(): void {
    this.aplicar(() => []);
  }

  private aplicar(cambio: (actuales: Actividad[]) => Actividad[]): void {
    this.lista.update(cambio);
    this.sinGuardarInterno.set(!this.almacen.guardar(CLAVE, this.lista()));
  }

  private cargar(): void {
    if (!this.almacen.existe(CLAVE)) {
      this.lista.set(copiarIniciales());
      this.avisoInterno.set('');
      return;
    }

    const valor = this.almacen.leer(CLAVE);
    if (!esColeccionActividades(valor)) {
      this.lista.set(copiarIniciales());
      this.avisoInterno.set('No se pudo leer lo guardado. Se muestran las actividades de ejemplo.');
      return;
    }

    this.lista.set(valor.map((actividad) => ({ ...actividad })));
    this.avisoInterno.set('');
    this.sinGuardarInterno.set(false);
  }

  private siguienteEstado(estado: EstadoActividad): EstadoActividad {
    if (estado === 'pendiente') return 'en_progreso';
    if (estado === 'en_progreso') return 'completada';
    return 'completada';
  }
}