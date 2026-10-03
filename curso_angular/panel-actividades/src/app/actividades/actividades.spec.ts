import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ActividadesApi } from './actividades-api';
import { ActividadesService } from './actividades';
import { AlmacenamientoService } from '../compartido/almacenamiento';

const REMOTAS = [
  {
    id: 1,
    task_title: 'Resolver ecuaciones lineales',
    description: 'Practicar ecuaciones de primer grado.',
    priority_level: 3,
    is_done: false,
    created_at: '2026-08-10T09:00:00Z',
  },
  {
    id: 2,
    task_title: 'Practicar funciones trigonométricas',
    description: 'Repasar seno, coseno y tangente.',
    priority_level: 2,
    is_done: false,
    created_at: '2026-08-12T09:00:00Z',
  },
  {
    id: 3,
    task_title: 'Calcular áreas de triángulos',
    description: 'Aplicar la fórmula de base por altura.',
    priority_level: 1,
    is_done: true,
    created_at: '2026-08-14T09:00:00Z',
  },
];

describe('ActividadesService', () => {
  let servicio: ActividadesService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withFetch()),
        provideHttpClientTesting(),
        ActividadesApi,
        ActividadesService,
        AlmacenamientoService,
      ],
    });

    http = TestBed.inject(HttpTestingController);
    servicio = TestBed.inject(ActividadesService);
    http.expectOne('/api/actividades').flush(REMOTAS);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  describe('al cargar', () => {
    it('trae las actividades del servidor traducidas', () => {
      expect(servicio.total()).toBe(3);
      expect(servicio.actividades()[0].titulo).toBe('Resolver ecuaciones lineales');
      expect(servicio.actividades()[0].prioridad).toBe('alta');
    });

    it('cuenta pendientes y completadas por separado', () => {
      expect(servicio.pendientes()).toBe(2);
      expect(servicio.completadas()).toBe(1);
      expect(servicio.porcentaje()).toBe(33);
    });
  });

  describe('crear', () => {
    it('recorta los espacios del título', () => {
      const creada = servicio.crear('  Revisar el foco  ', '', 'alta');

      expect(creada?.titulo).toBe('Revisar el foco');
      http
        .expectOne((request) => request.method === 'POST')
        .flush({ ...REMOTAS[0], id: 9, task_title: 'Revisar el foco' });
    });

    it('devuelve una actividad con identificador y estado pendiente', () => {
      const creada = servicio.crear('Revisar el foco', '', 'alta');

      expect(creada).not.toBeNull();
      expect(creada?.id).toBeGreaterThan(0);
      expect(creada?.estado).toBe('pendiente');
      http.expectOne((request) => request.method === 'POST').flush({ ...REMOTAS[0], id: 9 });
    });

    it('rechaza un título de dos caracteres', () => {
      expect(servicio.crear('ab', '', 'alta')).toBeNull();
      expect(servicio.total()).toBe(3);
    });

    it('acepta un título de tres caracteres', () => {
      expect(servicio.crear('abc', '', 'alta')).not.toBeNull();
      http.expectOne((request) => request.method === 'POST').flush({ ...REMOTAS[0], id: 9 });
    });

    it('rechaza un título repetido sin distinguir mayúsculas', () => {
      expect(servicio.crear('resolver ECUACIONES lineales', '', 'alta')).toBeNull();
      expect(servicio.total()).toBe(3);
    });
  });

  describe('avanzarEstado', () => {
    it('lleva una actividad pendiente a en progreso', () => {
      expect(servicio.avanzarEstado(1)).toBe('en_progreso');
      expect(servicio.buscarPorId(1)?.estado).toBe('en_progreso');
    });

    it('lleva una actividad en progreso a completada', () => {
      servicio.avanzarEstado(1);

      expect(servicio.avanzarEstado(1)).toBe('completada');
      expect(servicio.buscarPorId(1)?.estado).toBe('completada');
    });

    it('no avanza una actividad que ya está completada', () => {
      expect(servicio.avanzarEstado(3)).toBeNull();
      expect(servicio.buscarPorId(3)?.estado).toBe('completada');
    });

    it('no toca la lista si el identificador no existe', () => {
      const antes = servicio.actividades();

      servicio.avanzarEstado(999);

      expect(servicio.actividades()).toBe(antes);
    });
  });

  describe('eliminar', () => {
    it('quita solo la actividad solicitada', () => {
      expect(servicio.eliminar(2)).toBe(true);
      expect(servicio.total()).toBe(2);
      expect(servicio.buscarPorId(2)).toBeUndefined();
      http.expectOne((request) => request.method === 'DELETE').flush(null);
    });

    it('avisa si el servidor rechaza la eliminación', () => {
      servicio.eliminar(2);
      http
        .expectOne((request) => request.method === 'DELETE')
        .error(new ProgressEvent('error'), { status: 0 });

      expect(servicio.total()).toBe(2);
      expect(servicio.aviso()).toContain('No se pudo eliminar');
    });
  });

  describe('buscarPorId', () => {
    it('devuelve undefined si no existe', () => {
      expect(servicio.buscarPorId(999)).toBeUndefined();
    });
  });
});
