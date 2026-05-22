export interface ProveedorSaveDto {
  id?: number;
  nombre: string;
  oficio: string;
  empresa?: string;
  telefono: string;
  email: string;
  trabajaEnArgasa: boolean;
  trabajaEnLuga: boolean;
  trabajoRealizado: string;
  direccion: string;
  cif: string;
  fechaAltaProveedor?: string | null;
  localidad: string;
  codigoPostal: string;
  provincia: string;
  pais: string;
  contacto: string;
  datosBancarios: string;
  numeroCuenta?: string;
  iban?: string;
  notas: string;
}
