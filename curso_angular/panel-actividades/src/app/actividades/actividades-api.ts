import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Actividad, Prioridad, EstadoActividad } from '../modelos/actividad';

type ActividadServidor = {
  id: number;
  task_title: string;
  description: string | null;
  priority_level: number;
  is_done: boolean;
  created_at: string;
};

const PRIORIDADES: Record<number, Prioridad> = {
  1: 'baja',
  2: 'media',
  3: 'alta',
};

function aDominio(actividad: ActividadServidor): Actividad {
  return {
    id: actividad.id,
    titulo: actividad.task_title,
    descripcion: actividad.description ?? '',
    estado: actividad.is_done ? 'completada' : 'pendiente',
    prioridad: PRIORIDADES[actividad.priority_level] ?? 'media',
    creadaEn: actividad.created_at.slice(0, 10),
    destacada: false,
  };
}

function aServidor(actividad: {
  titulo: string;
  descripcion: string;
  prioridad: Prioridad;
  estado?: EstadoActividad;
  creadaEn?: string;
}): Partial<ActividadServidor> {
  const prioridad = { baja: 1, media: 2, alta: 3 }[actividad.prioridad] ?? 2;

  return {
    task_title: actividad.titulo,
    description: actividad.descripcion.trim() || null,
    priority_level: prioridad,
    is_done: actividad.estado === 'completada',
    created_at: actividad.creadaEn ?? new Date().toISOString(),
  };
}

@Service()
export class ActividadesApi {
  private readonly http = inject(HttpClient, { optional: true });

  listar(): Observable<Actividad[]> {
    if (!this.http) {
      return of([]);
    }

    return this.http.get<ActividadServidor[]>('/api/actividades').pipe(
      map((actividades) => actividades.map(aDominio)),
      catchError((error: HttpErrorResponse) => {
        throw error;
      }),
    );
  }

  obtener(id: number): Observable<Actividad | null> {
    if (!this.http) {
      return of(null);
    }

    return this.http.get<ActividadServidor>(`/api/actividades/${id}`).pipe(
      map((actividad) => aDominio(actividad)),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          return of(null);
        }
        throw error;
      }),
    );
  }

  crear(datos: { titulo: string; descripcion: string; prioridad: Prioridad }): Observable<Actividad> {
    if (!this.http) {
      return of({
        id: Date.now(),
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        estado: 'pendiente',
        prioridad: datos.prioridad,
        creadaEn: new Date().toISOString().slice(0, 10),
        destacada: false,
      });
    }

    return this.http.post<ActividadServidor>('/api/actividades', aServidor({ ...datos, estado: 'pendiente' })).pipe(
      map((actividad) => aDominio(actividad)),
    );
  }

  actualizar(id: number, datos: { titulo: string; descripcion: string; prioridad: Prioridad }): Observable<Actividad> {
    if (!this.http) {
      return of({
        id,
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        estado: 'pendiente',
        prioridad: datos.prioridad,
        creadaEn: new Date().toISOString().slice(0, 10),
        destacada: false,
      });
    }

    return this.http.put<ActividadServidor>(`/api/actividades/${id}`, aServidor({ ...datos, estado: 'pendiente' })).pipe(
      map((actividad) => aDominio(actividad)),
    );
  }

  eliminar(id: number): Observable<void> {
    if (!this.http) {
      return of(undefined);
    }

    return this.http.delete<void>(`/api/actividades/${id}`);
  }
}
