export interface ProductoCantidadDTO {
  producto: number; // ✅ ID del producto (Long en backend)
  cantidad: number;
}

export interface RutaDiaItemDTO {
  clienteId: number | null;
  tarea: string;
  observaciones: string;
  estado?: string;
  empresa?: string;
  productos: ProductoCantidadDTO[];

  // helpers UI (no hace falta enviarlos)

  // solo frontend
  productoSel?: number | null;
  cantidadSel?: number;

  productosCliente?: any[];
}

export interface RutaDiaRequestDTO {
  fecha: string; // ✅ string (backend lo parsea)
  nombreTransportista: string;
  emailTransportista: string;
  estado: string;
  empresa: string;
  rutas: RutaDiaItemDTO[];
}
