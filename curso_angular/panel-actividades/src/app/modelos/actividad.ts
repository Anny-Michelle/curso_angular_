export type EstadoActividad = 'pendiente' | 'en_progreso' | 'completada';

export type Prioridad = 'baja' | 'media' | 'alta';

export interface Actividad {
  id: number;
  titulo: string;
  descripcion: string;
  estado: EstadoActividad;
  prioridad: Prioridad;
  creadaEn: string;
  destacada: boolean;
}

export const LIMITES = {
  tituloMin: 3,
  tituloMax: 80,
  descripcionMax: 300,
} as const;

export type FiltroEstado = EstadoActividad | 'todas';

export type FiltroPrioridad = Prioridad | 'todas';

export const ETIQUETAS: Record<EstadoActividad, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  completada: 'Completada',
};

function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

export function esEstadoActividad(valor: unknown): valor is EstadoActividad {
  return valor === 'pendiente' || valor === 'en_progreso' || valor === 'completada';
}

export function esPrioridad(valor: unknown): valor is Prioridad {
  return valor === 'baja' || valor === 'media' || valor === 'alta';
}

export function esActividad(valor: unknown): valor is Actividad {
  if (!esRegistro(valor)) return false;

  return (
    typeof valor['id'] === 'number' &&
    Number.isInteger(valor['id']) &&
    valor['id'] > 0 &&
    typeof valor['titulo'] === 'string' &&
    valor['titulo'].trim().length > 0 &&
    typeof valor['descripcion'] === 'string' &&
    esEstadoActividad(valor['estado']) &&
    esPrioridad(valor['prioridad']) &&
    typeof valor['creadaEn'] === 'string' &&
    typeof valor['destacada'] === 'boolean'
  );
}

export function esColeccionActividades(valor: unknown): valor is Actividad[] {
  if (!Array.isArray(valor)) return false;

  const idsVistos = new Set<number>();
  for (const elemento of valor) {
    if (!esActividad(elemento) || idsVistos.has(elemento.id)) return false;
    idsVistos.add(elemento.id);
  }

  return true;
}