import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AgGridModule } from 'ag-grid-angular';
import { ReportsRoutingModule } from './reports-routing.module';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ReportsRoutingModule, 
    AgGridModule,
    FormsModule
    

  ]
})
export class ReportsModule { }
