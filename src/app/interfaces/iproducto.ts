export interface IProducto {
  id?: number;
  fechaAlta?: string;
  proveedor?: { id: number };
  unidades: number;
  referencia: string;
  marca: string;
  modelo: string;
  familia: string;
  subfamilia: string;
  descripcion: string;
  gama?: string;
  empresa: string;
  precioSinIva: number;
}
