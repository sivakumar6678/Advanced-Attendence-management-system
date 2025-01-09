import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrcTimetableComponent } from './crc-timetable.component';

describe('CrcTimetableComponent', () => {
  let component: CrcTimetableComponent;
  let fixture: ComponentFixture<CrcTimetableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrcTimetableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrcTimetableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
