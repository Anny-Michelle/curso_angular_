import { Routes } from '@angular/router';
import { PaginaActividades } from './actividades/pagina-actividades/pagina-actividades';
import { DetalleActividad } from './actividades/detalle-actividad/detalle-actividad';
import { SeccionActividades } from './actividades/seccion-actividades/seccion-actividades';
import { PaginaNoEncontrada } from './compartido/pagina-no-encontrada/pagina-no-encontrada';
import { puedeSalir } from './actividades/puede-salir';

export const routes: Routes = [
	{ path: '', redirectTo: 'actividades', pathMatch: 'full' },
	{
		path: 'actividades',
		component: SeccionActividades,
		children: [
			{ path: '', component: PaginaActividades, title: 'Actividades' },
			{
				path: 'nueva',
				title: 'Nueva actividad',
				canDeactivate: [puedeSalir],
				loadComponent: () =>
					import('./actividades/formulario-actividad/formulario-actividad').then(
						(modulo) => modulo.FormularioActividad,
					),
			},
			{ path: ':id', component: DetalleActividad, title: 'Detalle de la actividad' },
			{
				path: ':id/editar',
				title: 'Editar actividad',
				canDeactivate: [puedeSalir],
				loadComponent: () =>
					import('./actividades/formulario-actividad/formulario-actividad').then(
						(modulo) => modulo.FormularioActividad,
					),
			},
		],
	},
	{
		path: 'estadisticas',
		title: 'Estadísticas',
		loadComponent: () =>
			import('./estadisticas/pagina-estadisticas/pagina-estadisticas').then(
				(modulo) => modulo.PaginaEstadisticas,
			),
	},
	{
		path: 'sugerencias',
		title: 'Sugerencias',
		loadComponent: () =>
			import('./sugerencias/pagina-sugerencias/pagina-sugerencias').then(
				(modulo) => modulo.PaginaSugerencias,
			),
	},
	{ path: '**', component: PaginaNoEncontrada, title: 'Página no encontrada' },
];
