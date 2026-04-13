export interface IfacturaProveedor {
  id: number;
  empresa: string;
  fechaEmision: string;
  totalImporte: number;
  pagada: boolean;
  numeroInterno: string;
  numeroFacturaProveedor: string | null;
  proveedor?: any;
  trabajos?: any[];
}
