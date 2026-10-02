import { Component, computed, effect, inject, input } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { ActividadesService } from '../actividades';
import { Actividad, ETIQUETAS } from '../../modelos/actividad';

type Resultado =
  | { estado: 'invalido' }
  | { estado: 'ausente' }
  | { estado: 'encontrada'; actividad: Actividad };

@Component({
  selector: 'app-detalle-actividad',
  imports: [RouterLink],
  templateUrl: './detalle-actividad.html',
  styleUrl: './detalle-actividad.css',
})
export class DetalleActividad {
  private readonly servicio = inject(ActividadesService);
  private readonly router = inject(Router);
  private readonly titulo = inject(Title);

  readonly id = input.required<string>();

  protected readonly resultado = computed<Resultado>(() => {
    if (!/^[1-9]\d*$/.test(this.id())) return { estado: 'invalido' };

    const numero = Number(this.id());
    if (!Number.isSafeInteger(numero)) return { estado: 'invalido' };

    const actividad = this.servicio.buscarPorId(numero);
    return actividad ? { estado: 'encontrada', actividad } : { estado: 'ausente' };
  });

  protected readonly actividad = computed(() => {
    const resultado = this.resultado();
    return resultado.estado === 'encontrada' ? resultado.actividad : null;
  });

  protected readonly etiquetas = ETIQUETAS;

  constructor() {
    effect(() => {
      const resultado = this.resultado();
      const propio = resultado.estado === 'encontrada'
        ? resultado.actividad.titulo
        : resultado.estado === 'invalido' ? 'Dirección no válida' : 'Actividad no encontrada';
      this.titulo.setTitle(`${propio} · Panel de actividades`);
    });
  }

  protected eliminar(): void {
    const resultado = this.resultado();
    if (resultado.estado !== 'encontrada' || !confirm(`¿Eliminar «${resultado.actividad.titulo}»?`)) return;

    this.servicio.eliminar(resultado.actividad.id);
    void this.router.navigate(['/actividades'], { replaceUrl: true });
  }
}