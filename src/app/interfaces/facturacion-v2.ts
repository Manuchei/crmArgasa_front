export interface ServicioPendienteDTO {
  id: number;
  descripcion: string;
  fecha: string;      // ISO date
  importe: number;
}

export interface LineaAlbaranPendienteDTO {
  id: number;
  albaranId: number | null;
  descripcion: string;
  unidades: number;
  precio: number;
  dtoPct: number;
  totalLinea: number;
}

export interface PendientesFacturacionDTO {
  servicios: ServicioPendienteDTO[];
  lineasAlbaran: LineaAlbaranPendienteDTO[];
}

export interface CrearFacturaV2Request {
  clienteId: number;
  serie: string;

  // ✅ NOMBRES que espera el backend (CORREGIDO)
  servicioId: number[];
  lineasAlbaranIds: number[];
}


export interface LineaFacturaV2Response {
  id: number;
  tipoOrigen: 'SERVICIO' | 'ALBARAN_LINEA';
  origenId: number;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  ivaPct: number;
  totalLinea: number;
}

export interface FacturaV2Response {
  id: number;
  empresa: string;
  serie: string;
  numero: number;
  fechaEmision: string; // ISO date
  estado: 'BORRADOR' | 'EMITIDA' | 'PAGADA' | 'ANULADA';
  baseImponible: number;
  ivaTotal: number;
  total: number;
  lineas: LineaFacturaV2Response[];
}
