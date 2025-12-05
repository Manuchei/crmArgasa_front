export interface Ruta {
  id?: number;                 // opcional, para nuevas rutas
  nombreTransportista: string;
  fecha: string;               // la recibimos como string ISO (yyyy-MM-dd)
  estado: string;              // 'pendiente' | 'en_curso' | 'cerrada'
  observaciones: string;
  origen: string;
  destino: string;
  emailTransportista: string;

}
