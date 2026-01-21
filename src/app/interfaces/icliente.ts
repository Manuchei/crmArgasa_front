import { ITrabajo } from './itrabajo';

export interface ICliente {
  id?: number;

  // ✅ NUEVOS CAMPOS (backend)
  nombreApellidos: string;
  nombreComercial: string;
  direccion: string;
  codigoPostal: string;
  poblacion: string;
  provincia: string;
  telefono: string;
  movil: string;
  cifDni: string;

  // ya existía
  email: string;

  // totales
  totalImporte: number;
  totalPagado: number;

  trabajos: ITrabajo[];

  // campos calculados en front
  saldoDebe?: number;
  saldoPagado?: number;
  pendiente?: number; // (servicios sin factura)
}
