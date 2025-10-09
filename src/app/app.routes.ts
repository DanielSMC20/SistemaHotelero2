import { Routes } from '@angular/router';
import { LayoutComponent } from './Shared/components/layout/layout.component';
export const routes: Routes = [

   { path: '', redirectTo: 'login', pathMatch: 'full' },
   { path: 'login', loadComponent: () => 
        import('./authentication/login/login.component').then(m => m.LoginComponent) },
   { path: 'layout', loadComponent: () =>
        import('./Shared/components/layout/layout.component').then(m => m.LayoutComponent),
    children: [
        {
            path: 'dashboard', loadComponent: () =>
                import('./business/dashboard/dashboard.component').then(m => m.DashboardComponent)
        },
        {path:'', redirectTo:'dashboard', pathMatch:'full'}
    ]},
   { path: '**', redirectTo: 'login' }


];
