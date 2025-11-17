export interface IEventoCalendario {
  id: number;
  title: string;
  start: string;             // yyyy-MM-ddTHH:mm:ss
  estado: string;
  motivo: string;
  observaciones?: string;
}
