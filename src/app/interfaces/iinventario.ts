export interface IInventarioLinea {
  id?: number;

  productoId?: number;

  referencia: string;

  gama: string;

  marca: string;

  modelo: string;

  familia: string;

  subfamilia: string;

  descripcion: string;

  stockSistema: number;

  stockContado: number;

  diferencia?: number;

  precioUnitario: number;

  precioTotal?: number;
}

export interface IInventario {
  id?: number;

  empresa?: string;

  fecha?: string;

  descripcion: string;

  realizadoPor: string;

  totalUnidades?: number;

  totalInventario?: number;

  lineas: IInventarioLinea[];
}
