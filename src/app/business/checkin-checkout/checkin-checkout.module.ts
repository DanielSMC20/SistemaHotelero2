  import { NgModule } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { CheckinCheckoutRoutingModule } from './checkin-checkout-routing.module';
  import { ScheduleModule, RecurrenceEditorModule, DayService, WeekService, WorkWeekService, MonthService, AgendaService } from '@syncfusion/ej2-angular-schedule';
  import { DatePickerModule, TimePickerModule, DateTimePickerModule } from '@syncfusion/ej2-angular-calendars';
  import { DropDownListModule } from '@syncfusion/ej2-angular-dropdowns';
  import { ButtonModule } from '@syncfusion/ej2-angular-buttons';

  import { TodayActivitiesComponent } from '../checkin-checkout/components/today-activities/today-activities.component'; // 👈 importa tu componente

  @NgModule({
    imports: [
      CommonModule,
      CheckinCheckoutRoutingModule,
      ScheduleModule,
      RecurrenceEditorModule,
      DatePickerModule,
      TimePickerModule,
      DateTimePickerModule,
      DropDownListModule,
      ButtonModule,
      TodayActivitiesComponent
    ],
    providers: [DayService, WeekService, WorkWeekService, MonthService, AgendaService] // 👈 agrega los servicios
  })
  export class CheckinCheckoutModule { }
