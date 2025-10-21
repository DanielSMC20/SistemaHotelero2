import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TodayActivitiesComponent } from './today-activities.component';

describe('TodayActivitiesComponent', () => {
  let component: TodayActivitiesComponent;
  let fixture: ComponentFixture<TodayActivitiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TodayActivitiesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TodayActivitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
