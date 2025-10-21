import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ScheduleModule,
  RecurrenceEditorModule,
  EventSettingsModel,
  GroupModel,
  ResourceDetails,
  DayService,
  WeekService,
  WorkWeekService,
  MonthService,
  AgendaService
} from '@syncfusion/ej2-angular-schedule';
import { DatePickerModule, TimePickerModule, DateTimePickerModule } from '@syncfusion/ej2-angular-calendars';
import { DropDownListModule } from '@syncfusion/ej2-angular-dropdowns';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';

@Component({
  selector: 'app-today-activities',
  standalone: true,
  imports: [
    CommonModule,
    ScheduleModule,
    RecurrenceEditorModule,
    DatePickerModule,
    TimePickerModule,
    DateTimePickerModule,
    DropDownListModule,
    ButtonModule
  ],
  providers: [
    DayService,
    WeekService,
    WorkWeekService,
    MonthService,
    AgendaService
  ],
  templateUrl: './today-activities.component.html',
  styleUrls: ['./today-activities.component.css'],
})
export class TodayActivitiesComponent implements OnInit {
  selectedDate: Date = new Date(2025, 9, 13);
  public eventSettings!: EventSettingsModel;
  public group!: GroupModel;
  public roomResources!: ResourceDetails[];
  public rooms!: { Id: number; Text: string; Color: string }[];

  ngOnInit(): void {
    this.rooms = [
      { Id: 1, Text: 'Habitación 101', Color: '#f28b82' },
      { Id: 2, Text: 'Habitación 102', Color: '#fbbc04' },
      { Id: 3, Text: 'Habitación 103', Color: '#34a853' },
      { Id: 4, Text: 'Habitación 104', Color: '#4285f4' }
    ];

    this.eventSettings = {
      dataSource: [
        {
          Id: 1,
          Subject: 'Saúl Medina - Check-in',
          StartTime: new Date(2025, 9, 17, 14, 0),
          EndTime: new Date(2025, 9, 19, 12, 0),
          RoomId: 1,
          Description: 'Reserva: 12345\nTel: 987654321'
        },
        {
          Id: 2,
          Subject: 'Daniel Castro - Check-in',
          StartTime: new Date(2025, 9, 18, 15, 0),
          EndTime: new Date(2025, 9, 20, 10, 0),
          RoomId: 2,
          Description: 'Reserva: 12346\nTel: 912345678'
        }
      ],
      fields: {
        id: 'Id',
        subject: { name: 'Subject', title: 'Huésped' },
        description: { name: 'Description', title: 'Detalles' },
        startTime: { name: 'StartTime', title: 'Check-in' },
        endTime: { name: 'EndTime', title: 'Check-out' }
      }
    };

    this.group = {
      resources: ['Rooms']
    };
  }

  onPopupOpen(args: any) {
    if (args.type === 'QuickInfo') {
      const content = `
        <b>${args.data.Subject}</b><br>
        ${args.data.Description.replace(/\n/g, '<br>')}<br>
        ${args.data.StartTime.toLocaleString()} - ${args.data.EndTime.toLocaleString()}
      `;
      args.element.querySelector('.e-popup-content').innerHTML = content;
    }
  }
}
