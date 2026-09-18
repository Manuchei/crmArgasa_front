import { EstadoLlamada } from './illamada-request';

export interface ILlamada {
  id: number;
  nombre?: string;
  direccion?: string;
  motivo: string;
  fecha: string;
  hora: string,
  estado: EstadoLlamada; // ✅ así ya no es string
  observaciones?: string | null;
  clienteId: number | null;
}
