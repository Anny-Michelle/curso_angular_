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

  it('crea una actividad y conserva los datos si el título está duplicado', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/actividades/nueva');

    const titulo = harness.routeNativeElement?.querySelector<HTMLInputElement>('#titulo');
    const descripcion = harness.routeNativeElement?.querySelector<HTMLTextAreaElement>('#descripcion');
    expect(titulo).not.toBeNull();
    expect(descripcion).not.toBeNull();
    titulo!.value = 'Revisar funciones trigonométricas';
    titulo!.dispatchEvent(new Event('input', { bubbles: true }));
    descripcion!.value = 'No se debe perder este texto.';
    descripcion!.dispatchEvent(new Event('input', { bubbles: true }));
    harness.routeNativeElement
      ?.querySelector('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await harness.fixture.whenStable();

    expect(harness.routeNativeElement?.querySelector('[role="alert"]')?.textContent)
      .toContain('Ya existe una actividad');
    expect(harness.routeNativeElement?.querySelector<HTMLInputElement>('#titulo')?.value)
      .toBe('Revisar funciones trigonométricas');
    expect(harness.routeNativeElement?.querySelector<HTMLTextAreaElement>('#descripcion')?.value)
      .toBe('No se debe perder este texto.');
  });

  it('muestra errores al enviar el formulario vacío y enfoca el resumen', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/actividades/nueva');

    harness.routeNativeElement
      ?.querySelector('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await harness.fixture.whenStable();

    const resumen = harness.routeNativeElement?.querySelector('.resumen-errores');
    expect(resumen?.textContent)
      .toContain('El título es obligatorio.');
    expect(document.activeElement).toBe(resumen);
    expect(TestBed.inject(Router).url).toBe('/actividades/nueva');
  });

  it('crea una actividad y permite editarla desde su detalle', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/actividades/nueva');

    const titulo = harness.routeNativeElement?.querySelector<HTMLInputElement>('#titulo');
    const descripcion = harness.routeNativeElement?.querySelector<HTMLTextAreaElement>('#descripcion');
    titulo!.value = 'Preparar el informe';
    titulo!.dispatchEvent(new Event('input', { bubbles: true }));
    descripcion!.value = 'Resumen de la unidad.';
    descripcion!.dispatchEvent(new Event('input', { bubbles: true }));
    harness.routeNativeElement
      ?.querySelector('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await harness.fixture.whenStable();

    expect(harness.routeNativeElement?.textContent).toContain('Preparar el informe');
    expect(harness.routeNativeElement?.textContent).toContain('Resumen de la unidad.');

    await harness.navigateByUrl('/actividades/6/editar');
    expect(harness.routeNativeElement?.querySelector<HTMLInputElement>('#titulo')?.value)
      .toBe('Preparar el informe');

    const guardar = harness.routeNativeElement?.querySelector<HTMLButtonElement>('button[type="submit"]');
    guardar?.click();
    await harness.fixture.whenStable();
    expect(harness.routeNativeElement?.textContent).toContain('Preparar el informe');
    expect(TestBed.inject(Router).url).toBe('/actividades/6');
  });
});