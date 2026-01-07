export interface IfacturaCliente {
    id: number;
    empresa: string;
    fechaEmision: Date;
    totalImporte: number;
    pagada : boolean;

    cliente?: {
        id: number;
        nombre?: string;
    };

    servicio?: any[];
}
