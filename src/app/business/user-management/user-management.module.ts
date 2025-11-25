import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AgGridModule } from 'ag-grid-angular';
import { UserManagementRoutingModule } from './user-management.routing';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    UserManagementRoutingModule, 
    AgGridModule,
    FormsModule
    

  ]
})
export class UserManagementModule { }
