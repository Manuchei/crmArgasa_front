export type EstadoLlamada = 'pendiente' | 'realizada' | 'cancelada';

export interface ILlamadaRequest {
  motivo: string;
  fecha: string; // yyyy-MM-ddTHH:mm
  estado: EstadoLlamada;
  observaciones?: string | null;
  clienteId: number | null;
}
