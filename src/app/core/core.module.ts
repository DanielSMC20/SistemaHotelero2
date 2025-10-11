import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthService } from './services/auth.service';
import { ApiService } from './services/api.service';
import { HotelService } from './services/hotel.service';
import { AuthGuard } from './guards/auth.guard';

@NgModule({
  declarations: [],
  imports: [CommonModule],
  providers: [AuthService, ApiService, HotelService, AuthGuard],
})
export class CoreModule {}
