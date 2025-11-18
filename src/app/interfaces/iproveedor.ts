export interface Proveedor {
  id?: number;
  nombre: string;
  apellido: string;
  oficio: string;
  telefono: string;
  email: string;
  empresa?: string;
  trabajaEnArgasa?: boolean;
  trabajaEnLuga?: boolean;
  observaciones?: string;

  importeTotal?: number;
  importePagado?: number;
  importePendiente?: number;
}
