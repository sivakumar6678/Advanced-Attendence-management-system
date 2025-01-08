import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LecturerComponent } from './lecturer.component';

describe('LecturerComponent', () => {
  let component: LecturerComponent;
  let fixture: ComponentFixture<LecturerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LecturerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LecturerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
