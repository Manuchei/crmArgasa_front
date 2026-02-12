export interface IProducto {

    id?: number,
    codigo: string,
    nombre:string,
    stock: number,
    empresa: string, // "ARGASA" | "ELECTROLUGA"
    precioSinIva: number   // precio base (sin IVA)
        // opcional si en el futuro quieres varios IVAs
  // iva?: number;        // ejemplo: 0.21

}
