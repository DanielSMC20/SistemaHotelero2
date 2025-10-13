import { Routes } from '@angular/router';

import { DashboardComponent } from './business/dashboard/dashboard.component';
import { RoomListComponent } from './business/rooms/components/room-list/room-list.component';
import { ReservationListComponent } from './business/reservations/components/reservation-list/reservation-list.component';
import { GuestListComponent } from './business/guests/components/guest-list/guest-list.component';
import { TodayActivitiesComponent } from './business/checkin-checkout/components/today-activities/today-activities.component';
import { LoginComponent } from './authentication/login/login.component';

// Importar guards (COMMENTADO temporalmente para pruebas)
// import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  { path: 'dashboard', component: DashboardComponent },

  { path: 'login', component: LoginComponent },
  { path: 'rooms', component: RoomListComponent },
  { path: 'reservations', component: ReservationListComponent },
  { path: 'guests', component: GuestListComponent },
  { path: 'checkin', component: TodayActivitiesComponent },

  { path: '**', redirectTo: 'dashboard' },
];
