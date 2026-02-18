import { IProducto } from './iproducto';

export interface IClienteProducto {
  id?: number;
  producto: IProducto;
  estado: string; // PENDIENTTE/ENTREGADO
}
