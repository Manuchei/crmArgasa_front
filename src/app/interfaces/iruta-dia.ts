export interface ProductoCantidadDTO {
  producto: number;
  cantidad: number;
}

export interface RutaDiaItemDTO {
  clienteId: number | null;
  tarea: string;
  observaciones: string;
  estado?: string;
  empresa?: string;
  productos: ProductoCantidadDTO[];

  productoSel?: number | null;
  cantidadSel?: number;
  productosCliente?: any[];
}

export interface RutaDiaRequestDTO {
  fecha: string;
  transportistaId: number | null;

  nombreTransportista: string;
  emailTransportista: string;

  acompanante1?: string;
  acompanante2?: string;

  estado: string;
  empresa: string;
  rutas: RutaDiaItemDTO[];
}
