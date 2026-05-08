export interface IProductoMovimiento {
  id?: number;
  empresa: string;
  tipo: string;
  cantidad: number;
  unidadesAnteriores: number;
  unidadesNuevas: number;
  motivo?: string;
  fecha: string;
  producto?: {
    id?: number;
    referencia?: string;
    descripcion?: string;
    modelo?: string;
  };
}
