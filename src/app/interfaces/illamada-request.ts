export type EstadoLlamada = 'pendiente' | 'realizada' | 'cancelada';

export interface ILlamadaRequest {
  empresa: string; // ✅ NUEVO
  motivo: string;
  fecha: string; // yyyy-MM-ddTHH:mm
  estado: EstadoLlamada;
  observaciones: string;
  clienteId: number | null;
}
