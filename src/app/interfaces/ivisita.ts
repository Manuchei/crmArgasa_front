export type EstadoVisita =
  | 'pendiente'
  | 'en_progreso'
  | 'realizada'
  | 'cancelada';

export interface IVisita {
  id: number;
  empresa: string;
  titulo: string;
  fecha: string;
  estado: EstadoVisita;
  observaciones?: string | null;
}
