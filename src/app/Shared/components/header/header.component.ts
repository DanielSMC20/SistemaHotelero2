import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
 logout(): void {
    this.authService.logout(); // Limpia el token y currentUser
    this.router.navigate(['/login']); // Redirige al login
  }
}
