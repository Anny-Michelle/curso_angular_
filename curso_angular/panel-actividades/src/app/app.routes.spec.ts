import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';

describe('rutas de la aplicación', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter(routes, withComponentInputBinding())],
    });
  });

  afterEach(() => localStorage.clear());

  it('redirige la raíz a la lista de actividades', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/');

    expect(harness.routeNativeElement?.textContent).toContain('Mi tablero de progreso');
  });

  it('inicializa los filtros desde parámetros de consulta', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/actividades?buscar=geometr%C3%ADa&estado=pendiente&prioridad=alta');

    const vista = harness.routeNativeElement;
    expect(vista?.querySelector<HTMLInputElement>('#busqueda')?.value).toBe('geometría');
    expect(vista?.querySelector<HTMLSelectElement>('#filtro-estado')?.value).toBe('pendiente');
    expect(vista?.querySelector<HTMLSelectElement>('#filtro-prioridad')?.value).toBe('alta');
    expect(vista?.querySelectorAll('.lista > li').length).toBe(1);
  });

  it('actualiza la búsqueda sin borrar los demás filtros', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/actividades?estado=pendiente&prioridad=alta');

    const busqueda = harness.routeNativeElement?.querySelector<HTMLInputElement>('#busqueda');
    expect(busqueda).not.toBeNull();
    busqueda!.value = 'geometría';
    busqueda!.dispatchEvent(new Event('input', { bubbles: true }));
    await harness.fixture.whenStable();

    const parametros = TestBed.inject(Router).parseUrl(TestBed.inject(Router).url).queryParams;
    expect(parametros['buscar']).toBe('geometría');
    expect(parametros['estado']).toBe('pendiente');
    expect(parametros['prioridad']).toBe('alta');
  });

  it('actualiza el detalle y distingue identificadores inválidos y ausentes', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/actividades/3');
    expect(harness.routeNativeElement?.textContent).toContain('Practicar geometría analítica');

    await harness.navigateByUrl('/actividades/pepe');
    expect(harness.routeNativeElement?.textContent).toContain('Esa dirección no es válida');

    await harness.navigateByUrl('/actividades/9999');
    expect(harness.routeNativeElement?.textContent).toContain('Esa actividad no existe o se eliminó');
  });
});