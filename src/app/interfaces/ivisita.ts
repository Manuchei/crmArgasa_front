export type EstadoVisita = 'pendiente' | 'realizada' | 'cancelada';

export interface IVisita {
  id: number;
  empresa: string;
  titulo: string;
  fecha: string;
  estado: EstadoVisita;
  observaciones?: string | null;
}
