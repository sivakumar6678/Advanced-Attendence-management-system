import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherAuthComponent } from './teacher-auth.component';

describe('TeacherAuthComponent', () => {
  let component: TeacherAuthComponent;
  let fixture: ComponentFixture<TeacherAuthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherAuthComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeacherAuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
