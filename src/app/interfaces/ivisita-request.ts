import { EstadoVisita } from './ivisita';

export interface IVisitaRequest {
  empresa: string;
  titulo: string;
  fecha: string; // yyyy-MM-ddTHH:mm
  estado: EstadoVisita;
  observaciones: string;
}
