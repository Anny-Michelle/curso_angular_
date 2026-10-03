import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ActividadesApi } from './actividades/actividades-api';
import { ActividadesService } from './actividades/actividades';
import { AlmacenamientoService } from './compartido/almacenamiento';
import { routes } from './app.routes';

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

describe('las direcciones', () => {
  let arnes: RouterTestingHarness;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withFetch()),
        provideHttpClientTesting(),
        provideRouter(routes, withComponentInputBinding()),
        ActividadesApi,
        ActividadesService,
        AlmacenamientoService,
      ],
    });

    http = TestBed.inject(HttpTestingController);
    arnes = await RouterTestingHarness.create();
  });

  afterEach(() => http.verify());

  function texto(): string {
    return (arnes.routeNativeElement as HTMLElement | null)?.textContent ?? '';
  }

  function servir(): void {
    http.match('/api/actividades').forEach((peticion) => peticion.flush(REMOTAS));
  }

  it('lleva la raíz a la lista de actividades', async () => {
    await arnes.navigateByUrl('/');
    servir();

    expect(TestBed.inject(Router).url).toBe('/actividades');
  });

  it('abre el detalle de una actividad por su identificador', async () => {
    await arnes.navigateByUrl('/actividades/2');
    servir();
    arnes.fixture.detectChanges();

    expect(texto()).toContain('Practicar funciones trigonométricas');
  });

  it('distingue una actividad ausente de una dirección inválida', async () => {
    await arnes.navigateByUrl('/actividades/9999');
    servir();
    arnes.fixture.detectChanges();
    expect(texto()).toContain('no existe');

    await arnes.navigateByUrl('/actividades/abc');
    arnes.fixture.detectChanges();
    expect(texto()).toContain('no es válida');
  });

  it('muestra una página de no encontrada para una dirección inventada', async () => {
    await arnes.navigateByUrl('/lo-que-sea');
    arnes.fixture.detectChanges();

    expect(texto()).toContain('Esa página no existe');
  });

  it('no confunde la ruta reservada nueva con un identificador', async () => {
    await arnes.navigateByUrl('/actividades/nueva');
    servir();
    arnes.fixture.detectChanges();

    expect(texto()).toContain('Nueva actividad');
    expect(texto()).not.toContain('no es válida');
  });
});
