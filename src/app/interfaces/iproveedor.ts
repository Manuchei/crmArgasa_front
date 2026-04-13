import { IProducto } from './iproducto';

export interface Proveedor {
  id?: number;
  nombre: string;
  apellido?: string;
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
  notas?: string;
  contactos?: string;

  // backend actual
  importeTotal?: number;
  importePagado?: number;
  importePendiente?: number;

  // aliases semánticos futuros si luego quieres migrar naming
  totalCompras?: number;
  pendientePago?: number;

  productos?: IProducto[];
}
