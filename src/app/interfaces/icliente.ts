import { ITrabajo } from './itrabajo';

export interface ICliente {
  id?: number;

  // ✅ CAMPOS (backend)
  empresa?: string; // viene del backend (READ_ONLY), NO se manda al crear
  nombreApellidos: string;
  direccion: string;
  codigoPostal: string;
  poblacion: string;
  provincia: string;
  telefono: string;
  movil: string;
  cifDni: string;

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
