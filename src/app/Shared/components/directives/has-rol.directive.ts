// src/app/shared/directives/has-rol.directive.ts
import {
  Directive, Input, TemplateRef, ViewContainerRef, OnDestroy, ChangeDetectorRef
} from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
export type Rol = 'ADMIN' | 'RECEPCIONISTA' | 'GERENTE';

@Directive({
  selector: '[appHasRol]',

  standalone: true, 
})
export class HasRolDirective implements OnDestroy {
  private required: Rol[] = [];
  private sub: Subscription;

  constructor(
    private tpl: TemplateRef<any>,
    private vcr: ViewContainerRef,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.sub = this.auth.currentUser$.subscribe(() => {
      this.render();
      this.cdr.markForCheck();
    });
  }

  @Input() set appHasRol(value: Rol | Rol[]) {
    const list = Array.isArray(value) ? value : [value];
    this.required = list.map(s => s.toUpperCase().trim()) as Rol[];
    this.render();
  }

private render() {
  this.vcr.clear();

  const user = this.auth.currentUser;
  if (!user) return;

  // ✅ role es STRING, no array
  const currentRole = String(user.role ?? '')
    .toUpperCase()
    .trim();

  const ok = this.required.includes(currentRole as Rol);

  if (ok) {
    this.vcr.createEmbeddedView(this.tpl);
  }
}

  ngOnDestroy() { this.sub?.unsubscribe(); }
}
