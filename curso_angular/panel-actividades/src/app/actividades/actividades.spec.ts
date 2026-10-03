import { TestBed } from '@angular/core/testing';
import { ActividadesService } from './actividades';

const CLAVE = 'panel.actividades.v1';

describe('ActividadesService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => localStorage.clear());

  it('actualiza los derivados y persiste los cambios de dominio', () => {
    const servicio = TestBed.inject(ActividadesService);

    expect(servicio.total()).toBe(5);
    expect(servicio.pendientes()).toBe(3);
    expect(servicio.avanzarEstado(3)).toBe('en_progreso');
    expect(servicio.enProgreso()).toBe(2);

    const guardadas = JSON.parse(localStorage.getItem(CLAVE) ?? 'null');
    expect(guardadas.find((actividad: { id: number }) => actividad.id === 3).estado).toBe('en_progreso');
  });

  it('recupera una lista vacia como un valor guardado', () => {
    localStorage.setItem(CLAVE, '[]');

    const servicio = TestBed.inject(ActividadesService);

    expect(servicio.total()).toBe(0);
    expect(servicio.aviso()).toBe('');
  });

  it('migra actividades guardadas antes de incorporar la descripción', () => {
    const anteriores = [
      { id: 21, titulo: 'Actividad anterior', estado: 'pendiente', prioridad: 'media', creadaEn: '2026-08-20', destacada: false },
    ];
    localStorage.setItem(CLAVE, JSON.stringify(anteriores));

    const servicio = TestBed.inject(ActividadesService);

    expect(servicio.actividades()).toEqual([{ ...anteriores[0], descripcion: '' }]);
    expect(JSON.parse(localStorage.getItem(CLAVE) ?? 'null')).toEqual(servicio.actividades());
  });

  it('avisa ante datos corruptos y conserva el valor original', () => {
    localStorage.setItem(CLAVE, '{roto');

    const servicio = TestBed.inject(ActividadesService);

    expect(servicio.total()).toBe(5);
    expect(servicio.aviso()).toContain('No se pudo leer lo guardado');
    expect(localStorage.getItem(CLAVE)).toBe('{roto');
  });

  it('recarga cambios de otras pestañas solo para la clave del tablero', () => {
    const servicio = TestBed.inject(ActividadesService);
    const actualizadas = servicio.actividades().map((actividad) =>
      actividad.id === 3 ? { ...actividad, estado: 'completada' as const } : actividad,
    );
    localStorage.setItem(CLAVE, JSON.stringify(actualizadas));

    window.dispatchEvent(new StorageEvent('storage', { key: 'otra-clave' }));
    expect(servicio.buscarPorId(3)?.estado).toBe('pendiente');

    window.dispatchEvent(new StorageEvent('storage', { key: CLAVE }));
    expect(servicio.buscarPorId(3)?.estado).toBe('completada');
  });
});