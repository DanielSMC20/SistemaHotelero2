import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckinFormComponent } from './checkin-form.component';

describe('CheckinFormComponent', () => {
  let component: CheckinFormComponent;
  let fixture: ComponentFixture<CheckinFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckinFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CheckinFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
