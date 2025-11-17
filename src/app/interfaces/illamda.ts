export interface ILlamada {
  id: number;
  motivo: string;
  fecha: string; 
  estado: string;
  observaciones?: string;
  clienteId: number | null;
}
