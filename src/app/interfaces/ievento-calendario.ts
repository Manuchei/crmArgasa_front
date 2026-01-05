export interface IEventoCalendario {
  id: number;
  title: string;
  start: string; // yyyy-MM-ddTHH:mm
  estado: string;
  observaciones: string;
  fecha?: string; // opcional
}
