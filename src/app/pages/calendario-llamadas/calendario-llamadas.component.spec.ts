import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendarioLlamadasComponent } from './calendario-llamadas.component';

describe('CalendarioLlamadasComponent', () => {
  let component: CalendarioLlamadasComponent;
  let fixture: ComponentFixture<CalendarioLlamadasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarioLlamadasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalendarioLlamadasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
