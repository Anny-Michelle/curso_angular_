import { Component, inject } from '@angular/core';
import { ActividadesService } from '../../actividades/actividades';

@Component({
  selector: 'app-pagina-estadisticas',
  templateUrl: './pagina-estadisticas.html',
  styleUrl: './pagina-estadisticas.css',
})
export class PaginaEstadisticas {
  private readonly servicio = inject(ActividadesService);

  protected readonly total = this.servicio.total;
  protected readonly pendientes = this.servicio.pendientes;
  protected readonly enProgreso = this.servicio.enProgreso;
  protected readonly completadas = this.servicio.completadas;
}