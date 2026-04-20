export interface IProducto {
  id?: number;
  codigo: string;
  nombre: string;
  modelo?: string;
  stock: number;
  empresa: string;
  precioSinIva: number;
  proveedor?: { id: number };
}
