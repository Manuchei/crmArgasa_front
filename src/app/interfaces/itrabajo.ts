export interface ITrabajo {
  id?: number;
  descripcion: string;

  unidades?: number;
  precioUnitario?: number;
  descuento?: number;

  importe: number;          // importe neto
  importePagado: number;
  pagado: boolean;

  fecha?: string;
}
