import { ITrabajo } from './itrabajo';

export interface ICliente {
  id?: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  empresa: string;
  totalImporte: number;
  totalPagado: number;
  trabajos: ITrabajo[];
    saldoDebe?: number;
  saldoPagado?: number;
}

