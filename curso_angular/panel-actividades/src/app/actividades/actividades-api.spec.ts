import { HttpErrorResponse, provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mensajeDe } from '../api/mensajes';
import type { Actividad } from '../modelos/actividad';
import { ActividadesApi } from './actividades-api';

const REMOTA = {
  id: 1,
  task_title: 'Resolver ecuaciones lineales',
  description: 'Practicar ecuaciones de primer grado.',
  priority_level: 3,
  is_done: false,
  created_at: '2026-08-10T09:00:00Z',
};

describe('ActividadesApi', () => {
  let api: ActividadesApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withFetch()), provideHttpClientTesting(), ActividadesApi],
    });

    api = TestBed.inject(ActividadesApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('traduce la respuesta del servidor al modelo de dominio', () => {
    let recibidas: Actividad[] = [];
    api.listar().subscribe((actividades) => (recibidas = actividades));

    const peticion = http.expectOne('/api/actividades');
    expect(peticion.request.method).toBe('GET');
    peticion.flush([REMOTA]);

    expect(recibidas).toEqual([
      {
        id: 1,
        titulo: 'Resolver ecuaciones lineales',
        descripcion: 'Practicar ecuaciones de primer grado.',
        prioridad: 'alta',
        estado: 'pendiente',
        creadaEn: '2026-08-10',
        destacada: false,
      },
    ]);
  });

  it('traduce una respuesta 404 de detalle a actividad ausente', () => {
    let resultado: unknown;
    api.obtener(99).subscribe((actividad) => (resultado = actividad));

    http.expectOne('/api/actividades/99').flush(null, {
      status: 404,
      statusText: 'Not Found',
    });

    expect(resultado).toBeNull();
  });

  it('propaga otros errores HTTP y permite obtener un mensaje legible', () => {
    let recibido: HttpErrorResponse | null = null;
    api.obtener(1).subscribe({
      error: (error: HttpErrorResponse) => (recibido = error),
    });

    http.expectOne('/api/actividades/1').flush('error', {
      status: 500,
      statusText: 'Server Error',
    });

    expect(recibido).not.toBeNull();
    expect(mensajeDe(recibido)).toBe('No se pudieron cargar las sugerencias.');
    expect(mensajeDe(new Error('otra cosa'))).toBe('otra cosa');
  });

  it('envía un POST con el cuerpo traducido al idioma del servidor', () => {
    api.crear({ titulo: 'Revisar', descripcion: '', prioridad: 'alta' }).subscribe();

    const peticion = http.expectOne('/api/actividades');
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toMatchObject({
      task_title: 'Revisar',
      description: null,
      priority_level: 3,
      is_done: false,
    });
    peticion.flush(REMOTA);
  });

  it('envía un PUT a la actividad indicada', () => {
    api
      .actualizar(7, { titulo: 'Actualizar', descripcion: 'Resumen', prioridad: 'media' })
      .subscribe();

    const peticion = http.expectOne('/api/actividades/7');
    expect(peticion.request.method).toBe('PUT');
    expect(peticion.request.body).toMatchObject({
      task_title: 'Actualizar',
      description: 'Resumen',
      priority_level: 2,
    });
    peticion.flush({ ...REMOTA, id: 7, task_title: 'Actualizar' });
  });

  it('envía un DELETE a la actividad indicada', () => {
    api.eliminar(7).subscribe();

    const peticion = http.expectOne('/api/actividades/7');
    expect(peticion.request.method).toBe('DELETE');
    peticion.flush(null);
  });
});
