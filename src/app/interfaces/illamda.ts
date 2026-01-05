import { EstadoLlamada } from './illamada-request';

export interface ILlamada {
  id: number;
  motivo: string;
  fecha: string;
  estado: EstadoLlamada; // ✅ así ya no es string
  observaciones?: string | null;
  clienteId: number | null;
}
