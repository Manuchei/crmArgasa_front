import { ITrabajo } from './itrabajo';

export interface ICliente {
  id?: number;

  empresa?: string;
  nombreApellidos: string;

  // Facturación
  direccion: string;
  codigoPostal: string;
  poblacion: string;
  provincia: string;

  // Entrega
  direccionEntrega?: string;
  codigoPostalEntrega?: string;
  poblacionEntrega?: string;
  provinciaEntrega?: string;

  telefono: string;
  movil: string;
  cifDni: string;
  email: string;

  totalImporte: number;
  totalPagado: number;

  trabajos: ITrabajo[];

  saldoDebe?: number;
  saldoPagado?: number;
  pendiente?: number;

  numeroCuenta?: string;
  iban?: string;
}
