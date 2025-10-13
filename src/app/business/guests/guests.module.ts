import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GuestsRoutingModule } from './guests-routing.module';
import { AgGridModule } from 'ag-grid-angular';



@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    GuestsRoutingModule, 
    AgGridModule
  ]
})
export class GuestsModule { }
