export interface HistorialSaldoMovimiento {
  fecha: string;
  tipo: string; // CARGO / ABONO
  concepto: string;
  cargo: number;
  abono: number;
  saldoAcumulado: number;
}

export interface HistorialSaldoResponse {
  clienteId: number;
  clienteNombre: string;
  empresa: string;
  saldoFinal: number;
  estadoSaldo: string; // PENDIENTE / A_FAVOR / SALDADO
  movimientos: HistorialSaldoMovimiento[];
}
