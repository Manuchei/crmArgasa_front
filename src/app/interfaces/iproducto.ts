export interface IProducto {
  id?: number;
  codigo: string;
  nombre: string;
  modelo?: string;
  stock: number;
  empresa: string; // "ARGASA" | "ELECTROLUGA"
  precioSinIva: number; // precio base (sin IVA)
  // iva?: number;
}
