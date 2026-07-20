import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CabeceraDocumentoComponent } from './cabecera-documento.component';

describe('CabeceraDocumentoComponent', () => {
  let component: CabeceraDocumentoComponent;
  let fixture: ComponentFixture<CabeceraDocumentoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CabeceraDocumentoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CabeceraDocumentoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
