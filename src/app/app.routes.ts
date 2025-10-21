// app.routes.ts (Angular con Router tradicional por componentes NO standalone)
import { Routes } from '@angular/router';

import { LayoutComponent } from './Shared/components/layout/layout.component';
import { LoginComponent } from './authentication/login/login.component';
import { DashboardComponent } from './business/dashboard/dashboard.component';
import { RoomListComponent } from './business/rooms/components/room-list/room-list.component';
import { ReservationListComponent } from './business/reservations/components/reservation-list/reservation-list.component';
import { GuestListComponent } from './business/guests/components/guest-list/guest-list.component';
import { ReportsComponent } from './business/reports/reports.component';

import { AuthGuard } from './core/guards/auth.guard';
import { CheckCenterComponent } from './business/checkin-checkout/shared/checkCenterComponent';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./authentication/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'layout',
    canActivate: [AuthGuard],
    component: LayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'rooms', component: RoomListComponent },
      { path: 'reservations', component: ReservationListComponent },
      { path: 'guests', component: GuestListComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'checkin', component: CheckCenterComponent },

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  { path: '**', redirectTo: 'login' },
];