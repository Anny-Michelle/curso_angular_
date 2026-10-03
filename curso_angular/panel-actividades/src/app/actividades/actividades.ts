import { computed, inject, Service, signal } from '@angular/core';
import { AlmacenamientoService } from '../compartido/almacenamiento';
import {
  Actividad,
  EstadoActividad,
  LIMITES,
  Prioridad,
  esColeccionActividades,
} from '../modelos/actividad';
import { ActividadesApi } from './actividades-api';

const CLAVE = 'panel.actividades.v1';

const INICIALES: readonly Actividad[] = [
  { id: 1, titulo: 'Resolver ecuaciones de primer grado', descripcion: '', estado: 'completada', prioridad: 'alta', creadaEn: '2026-08-10', destacada: false },
  { id: 2, titulo: 'Revisar funciones trigonométricas', descripcion: '', estado: 'en_progreso', prioridad: 'media', creadaEn: '2026-08-12', destacada: true },
  { id: 3, titulo: 'Practicar geometría analítica', descripcion: '', estado: 'pendiente', prioridad: 'alta', creadaEn: '2026-08-14', destacada: false },
  { id: 4, titulo: 'Repasar teorema de Pitágoras', descripcion: '', estado: 'pendiente', prioridad: 'baja', creadaEn: '2026-08-16', destacada: false },
  { id: 5, titulo: 'Simular examen de álgebra', descripcion: '', estado: 'pendiente', prioridad: 'media', creadaEn: '2026-08-18', destacada: false },
];

function copiarIniciales(): Actividad[] {
  return INICIALES.map((actividad) => ({ ...actividad }));
}

function completarDescripcion(valor: unknown): unknown {
  if (!Array.isArray(valor)) return valor;

  return valor.map((elemento: unknown) => {
    if (
      typeof elemento !== 'object' ||
      elemento === null ||
      Array.isArray(elemento) ||
      'descripcion' in elemento
    ) {
      return elemento;
    }

    return { ...elemento, descripcion: '' };
  });
}

@Service()
export class ActividadesService {
  private readonly almacen = inject(AlmacenamientoService);
  private readonly api = inject(ActividadesApi, { optional: true });
  private readonly lista = signal<Actividad[]>(copiarIniciales());
  private readonly avisoInterno = signal('');
  private readonly sinGuardarInterno = signal(false);
  private readonly cargandoInterno = signal(false);
  private readonly errorCargaInterna = signal<string | null>(null);

  readonly actividades = this.lista.asReadonly();
  readonly aviso = this.avisoInterno.asReadonly();
  readonly sinGuardar = this.sinGuardarInterno.asReadonly();
  readonly cargando = this.cargandoInterno.asReadonly();
  readonly errorCarga = this.errorCargaInterna.asReadonly();

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

  recargar(): void {
    this.cargar();
  }

  buscarPorId(id: number): Actividad | undefined {
    return this.lista().find((actividad) => actividad.id === id);
  }

  existeTitulo(titulo: string, exceptoId: number | null = null): boolean {
    const normalizado = titulo.trim().toLocaleLowerCase('es');
    return this.lista().some(
      (actividad) =>
        actividad.id !== exceptoId &&
        actividad.titulo.toLocaleLowerCase('es') === normalizado,
    );
  }

  crear(titulo: string, descripcion: string, prioridad: Prioridad): Actividad | null {
    const limpio = titulo.trim();
    if (!this.tituloAceptable(limpio, null) || descripcion.length > LIMITES.descripcionMax) {
      return null;
    }

    const nueva: Actividad = {
      id: this.siguienteId(),
      titulo: limpio,
      descripcion: descripcion.trim(),
      estado: 'pendiente',
      prioridad,
      creadaEn: new Date().toISOString().slice(0, 10),
      destacada: false,
    };

    this.aplicar((actuales) => [...actuales, nueva]);
    if (this.api) {
      this.api.crear({ titulo: limpio, descripcion: descripcion.trim(), prioridad }).subscribe({
        next: (remota) => {
          this.lista.update((actuales) => actuales.map((actual) => actual.id === nueva.id ? remota : actual));
        },
        error: () => {
          this.avisoInterno.set('No se pudo guardar la actividad en el servidor.');
        },
      });
    }
    return nueva;
  }

  actualizar(id: number, titulo: string, descripcion: string, prioridad: Prioridad): boolean {
    const limpio = titulo.trim();
    if (
      !this.buscarPorId(id) ||
      !this.tituloAceptable(limpio, id) ||
      descripcion.length > LIMITES.descripcionMax
    ) {
      return false;
    }

    this.aplicar((actuales) =>
      actuales.map((actividad) =>
        actividad.id === id
          ? { ...actividad, titulo: limpio, descripcion: descripcion.trim(), prioridad }
          : actividad,
      ),
    );
    if (this.api) {
      this.api.actualizar(id, { titulo: limpio, descripcion: descripcion.trim(), prioridad }).subscribe({
        next: (remota) => {
          this.lista.update((actuales) => actuales.map((actual) => actual.id === id ? remota : actual));
        },
        error: () => {
          this.avisoInterno.set('No se pudo guardar la actividad en el servidor.');
        },
      });
    }
    return true;
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
    if (this.api) {
      this.api.eliminar(id).subscribe({
        error: () => {
          this.avisoInterno.set('No se pudo eliminar la actividad en el servidor.');
        },
      });
    }
    return true;
  }

  vaciar(): void {
    this.aplicar(() => []);
  }

  private aplicar(cambio: (actuales: Actividad[]) => Actividad[]): void {
    this.lista.update(cambio);
    if (this.api) {
      this.sinGuardarInterno.set(false);
      return;
    }

    this.sinGuardarInterno.set(!this.almacen.guardar(CLAVE, this.lista()));
  }

  private cargar(): void {
    this.cargandoInterno.set(true);
    this.errorCargaInterna.set(null);

    if (this.api) {
      this.api.listar().subscribe({
        next: (actividades) => {
          this.lista.set(actividades.map((actividad) => ({ ...actividad })));
          this.avisoInterno.set('');
          this.sinGuardarInterno.set(false);
          this.errorCargaInterna.set(null);
          this.cargandoInterno.set(false);
        },
        error: () => {
          const valor = this.almacen.leer(CLAVE);
          const compatible = esColeccionActividades(valor) ? valor : completarDescripcion(valor);
          if (!esColeccionActividades(compatible)) {
            this.lista.set(copiarIniciales());
            this.avisoInterno.set('No se pudo leer lo guardado. Se muestran las actividades de ejemplo.');
            this.sinGuardarInterno.set(false);
            this.errorCargaInterna.set('No se pudieron cargar las actividades. Reinténtalo en unos segundos.');
            this.cargandoInterno.set(false);
            return;
          }

          this.lista.set(compatible.map((actividad) => ({ ...actividad })));
          this.avisoInterno.set('');
          this.sinGuardarInterno.set(false);
          this.errorCargaInterna.set('No se pudieron cargar las actividades. Se muestran los datos guardados localmente.');
          this.cargandoInterno.set(false);
        },
      });
      return;
    }

    if (!this.almacen.existe(CLAVE)) {
      this.lista.set(copiarIniciales());
      this.avisoInterno.set('');
      this.cargandoInterno.set(false);
      return;
    }

    const valor = this.almacen.leer(CLAVE);
    const compatible = esColeccionActividades(valor) ? valor : completarDescripcion(valor);
    if (!esColeccionActividades(compatible)) {
      this.lista.set(copiarIniciales());
      this.avisoInterno.set('No se pudo leer lo guardado. Se muestran las actividades de ejemplo.');
      return;
    }

    this.lista.set(compatible.map((actividad) => ({ ...actividad })));
    this.avisoInterno.set('');
    this.sinGuardarInterno.set(
      !esColeccionActividades(valor) && !this.almacen.guardar(CLAVE, compatible),
    );
    this.errorCargaInterna.set(null);
    this.cargandoInterno.set(false);
  }

  private siguienteEstado(estado: EstadoActividad): EstadoActividad {
    if (estado === 'pendiente') return 'en_progreso';
    if (estado === 'en_progreso') return 'completada';
    return 'completada';
  }

  private tituloAceptable(limpio: string, salvo: number | null): boolean {
    if (limpio.length < LIMITES.tituloMin || limpio.length > LIMITES.tituloMax) {
      return false;
    }

    const normalizado = limpio.toLocaleLowerCase('es');
    return !this.lista().some(
      (actividad) =>
        actividad.id !== salvo &&
        actividad.titulo.toLocaleLowerCase('es') === normalizado,
    );
  }

  private siguienteId(): number {
    return this.lista().reduce((mayor, actividad) => Math.max(mayor, actividad.id), 0) + 1;
  }
}