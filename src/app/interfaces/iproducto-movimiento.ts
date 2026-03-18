export interface IProductoMovimiento {
  id?: number;
  empresa: string;
  tipo: string; // ENTRADA / SALIDA
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  motivo?: string;
  fecha: string;
  producto?: {
    id?: number;
    codigo?: string;
    nombre?: string;
    modelo?: string;
  };
}
