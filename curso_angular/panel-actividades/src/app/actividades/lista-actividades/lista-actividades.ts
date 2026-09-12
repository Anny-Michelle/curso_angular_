import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import type { Actividad } from '../../modelos/actividad';

@Component({
  selector: 'app-lista-actividades',
  imports: [DatePipe],
  templateUrl: './lista-actividades.html',
  styleUrl: './lista-actividades.css'
})
export class ListaActividades {
  protected readonly actividades: Actividad[] = [
    { id: 1, titulo: 'Resolver ecuaciones lineales', estado: 'completada', prioridad: 'alta', creadaEn: '2026-08-10', destacada: false },
    { id: 2, titulo: 'Practicar funciones y gráficas', estado: 'en_progreso', prioridad: 'media', creadaEn: '2026-08-12', destacada: false },
    { id: 3, titulo: 'Revisar álgebra de polinomios', estado: 'pendiente', prioridad: 'alta', creadaEn: '2026-08-14', destacada: false },
    { id: 4, titulo: 'Estudiar geometría analítica', estado: 'pendiente', prioridad: 'baja', creadaEn: '2026-08-16', destacada: false }
  ];
}