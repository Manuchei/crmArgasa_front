export type EstadoTarea = 'pendiente' | 'realizada' | 'cancelada';

export interface ITarea {
  id: number;
  empresa: string;
  titulo: string;
  fecha: string;
  estado: EstadoTarea;
  observaciones?: string | null;
}
