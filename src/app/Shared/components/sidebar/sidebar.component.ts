import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent implements OnInit {
  isOpen = signal<boolean>(false);
  isLoggedIn = false;
  userName = '';
  userRole = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  toggleSidebar() {
    this.isOpen.update(v => !v);
  }

  closeSidebar() {
    this.isOpen.set(false);
  }

  /** ✅ Lee del localStorage los datos guardados al iniciar sesión */
  private loadUserData(): void {
    const token = localStorage.getItem('token');
    const nombre = localStorage.getItem('nombre');
    const role = localStorage.getItem('role');

    if (token && nombre) {
      this.isLoggedIn = true;
      this.userName = nombre;
      this.userRole = role || 'Usuario';
    } else {
      this.isLoggedIn = false;
    }
  }

  /** ✅ Iniciales automáticas del usuario */
  get initials(): string {
    if (!this.userName) return '?';
    const parts = this.userName.trim().split(' ');
    return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
  }

  /** ✅ Cerrar sesión limpia */
  logout(): void {
    localStorage.clear();
    this.isLoggedIn = false;
    this.router.navigate(['/login']);
  }
}
