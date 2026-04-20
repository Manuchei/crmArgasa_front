export interface ServicioPendienteDTO {
  id: number;
  descripcion: string;
  fecha: string;
  importe: number;
}

export interface LineaAlbaranPendienteDTO {
  id: number;
  albaranId: number | null;
  codigo?: string | null;
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
  descuentoPct: number;
  subtotal: number;
  ivaPct: number;
  totalLinea: number;
}

export interface FacturaV2Response {
  id: number;
  empresa: string;
  serie: string;
  numero: number;
  fechaEmision: string;
  estado: 'BORRADOR' | 'EMITIDA' | 'PAGADA' | 'ANULADA';
  baseImponible: number;
  ivaTotal: number;
  total: number;
  lineas: LineaFacturaV2Response[];
}

export interface LineaFacturaV2UpdateRequest {
  id: number;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuentoPct: number;
  ivaPct: number;
}

export interface ActualizarFacturaV2Request {
  fechaEmision?: string | null;
  lineas: LineaFacturaV2UpdateRequest[];
}