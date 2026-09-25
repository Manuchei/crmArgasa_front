import { EstadoTarea } from './itarea';

export interface ITareaRequest {
  empresa: string;
  titulo: string;
  fecha: string; // yyyy-MM-ddTHH:mm
  estado: EstadoTarea;
  observaciones: string;
  nombre?: string | null;
  direccion?: string | null;
}
