export interface TContableLinea {
  fecha: string;
  concepto: string;
  importe: number;
}

export interface HistorialTContableResponse {
  clienteId: number;
  clienteNombre: string;
  empresa: string;
  debe: TContableLinea[];
  haber: TContableLinea[];
  totalDebe: number;
  totalHaber: number;
  saldoFinal: number;
  estadoSaldo: string;
}
