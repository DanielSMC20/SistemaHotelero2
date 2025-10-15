import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';


@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [ HeaderComponent, SidebarComponent, RouterOutlet],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css',
})
export class LayoutComponent implements OnInit {

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // 🔥 Restaura sesión cada vez que se carga el layout
    this.authService.restoreSession();
  }
}