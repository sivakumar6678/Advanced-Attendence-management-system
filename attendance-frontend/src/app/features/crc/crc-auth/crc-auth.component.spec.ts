import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrcAuthComponent } from './crc-auth.component';

describe('CrcAuthComponent', () => {
  let component: CrcAuthComponent;
  let fixture: ComponentFixture<CrcAuthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrcAuthComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrcAuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
