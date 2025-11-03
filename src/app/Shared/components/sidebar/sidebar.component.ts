// src/app/shared/sidebar/sidebar.component.ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HasRolDirective } from '../directives/has-rol.directive';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, HasRolDirective],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent {
  // estado de apertura (sirve para tu [class.-translate-x-80] y backdrop)
  private openSig = signal(true);

  constructor(public authService: AuthService) {}

  isOpen(): boolean {
    return this.openSig();
  }
  openSidebar(): void {
    this.openSig.set(true);
  }
  closeSidebar(): void {
    this.openSig.set(false);
  }
}
