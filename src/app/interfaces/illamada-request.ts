export type EstadoLlamada =
  | 'pendiente'
  | 'en_progreso'
  | 'realizada'
  | 'cancelada';

export interface ILlamadaRequest {
  empresa: string; // ✅ NUEVO
  nombre: string;
  direccion: string;
  motivo: string;
  fecha: string; // yyyy-MM-ddTHH:mm
  estado: EstadoLlamada;
  observaciones: string;
  clienteId: number | null;
}
