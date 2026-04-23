export interface Ruta {
  id?: number;

  clienteId?: number;
  transportistaId?: number;

  empresa?: string;

  nombreTransportista: string;
  emailTransportista: string;
  fecha: string;
  estado: string;
  tarea?: string;
  observaciones: string;

  destino: string;
  origen?: string;

  lineas?: IRutaLineaDto[];

  cliente?: {
    id: number;
    nombreApellidos: string;
    nombreComercial?: string;
  };

  transportista?: {
    id: number;
    nombre: string;
    email: string;
    empresa?: string;
  };
}

export interface IRutaLineaDto {
  productoId: number;
  cantidad: number;
}