export interface ILineaFacturaProveedor {
  id?: number;
  tipoOrigen?: string;
  origenId?: number;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuentoPct: number;
  subtotal: number;
  ivaPct: number;
  totalLinea: number;
}

export interface IfacturaProveedor {
  id: number;
  empresa: string;
  fechaEmision: string;
  estado: 'BORRADOR' | 'EMITIDA' | 'PAGADA';
  baseImponible: number;
  ivaTotal: number;
  totalImporte: number;
  pagada: boolean;
  numeroInterno: string;
  numeroFacturaProveedor: string | null;
  proveedor?: any;
  albaranProveedor?: any;
  lineas: ILineaFacturaProveedor[];
}
