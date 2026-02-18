export interface Ruta {
  id?: number;

  // 🔹 Para crear / editar (se envía al backend)
  clienteId?: number;

  // 🔹 Empresa (se manda también por header)
  empresa?: string;

  // 🔹 Datos de la ruta
  nombreTransportista: string;
  emailTransportista: string;
  fecha: string;
  estado: string;
  tarea?: string;
  observaciones: string;

  // 🔹 Dirección final (sale del cliente)
  destino: string;

  // 🔹 Mantengo origen solo por compatibilidad (no usar en UI)
  origen?: string;

  // 🔹 Objeto cliente que VIENE del backend
  cliente?: {
    id: number;
    nombreApellidos: string;
    nombreComercial?: string;
  };
}
