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
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },

  // AuthGuard pruebas, descomenta Mitma prox..
  {
    path: 'login',
    component: LoginComponent,
  },

  {
    path: 'dashboard',
    component: DashboardComponent,
    // , canActivate: [AuthGuard]
  },

  {
    path: 'rooms',
    component: RoomListComponent,
    // , canActivate: [AuthGuard]
  },

  {
    path: 'reservations',
    component: ReservationListComponent,
    // , canActivate: [AuthGuard]
  },

  {
    path: 'guests',
    component: GuestListComponent,
    // , canActivate: [AuthGuard]
  },

  {
    path: 'checkin',
    component: TodayActivitiesComponent,
    // , canActivate: [AuthGuard]
  },

  // Ruta no encontrada
  { path: '**', redirectTo: '/login' },
];
