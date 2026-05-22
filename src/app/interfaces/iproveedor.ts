import { IProducto } from './iproducto';

export interface Proveedor {
  id?: number;
  nombre: string;
  oficio?: string;
  telefono: string;
  email: string;
  empresa?: string;
  trabajaEnArgasa?: boolean;
  trabajaEnLuga?: boolean;
  trabajoRealizado?: string;

  direccion?: string;
  cif?: string;
  fechaAltaProveedor?: string;
  localidad?: string;
  codigoPostal?: string;
  provincia?: string;
  pais?: string;
  contacto?: string;
  datosBancarios?: string;
  numeroCuenta?: string;
  iban?: string;
  notas?: string;

  // backend actual
  importeTotal?: number;
  importePagado?: number;
  importePendiente?: number;

  // opcional (puedes quitarlos si no los usas)
  totalCompras?: number;
  pendientePago?: number;

  productos?: IProducto[];
}
