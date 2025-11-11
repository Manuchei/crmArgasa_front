import { Observable } from 'rxjs';
export interface IeventoCalendario {

    id: number,
    title: string,
    start: string,
    end: string,
    estado: string,
    observaciones?:string,
    clienteId?:number | null
}
