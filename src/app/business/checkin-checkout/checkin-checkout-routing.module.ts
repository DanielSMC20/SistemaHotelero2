import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TodayActivitiesComponent } from './components/today-activities/today-activities.component';

const routes: Routes = [
  {
    path: '',
    component: TodayActivitiesComponent // ✅ Usa tu componente standalone aquí
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CheckinCheckoutRoutingModule { }
