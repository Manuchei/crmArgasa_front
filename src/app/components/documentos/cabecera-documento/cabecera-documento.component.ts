import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-cabecera-documento',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cabecera-documento.component.html',
  styleUrls: ['./cabecera-documento.component.css'],
})
export class CabeceraDocumentoComponent {

  @Input() empresa: any;

  @Input() titulo = '';

  @Input() numero = '';

  @Input() fecha = '';

  @Input() vencimiento = '';

  @Input() estado = '';

  @Input() receptor: any;

}