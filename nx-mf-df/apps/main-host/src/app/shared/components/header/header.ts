import { DatePipe } from '@angular/common';
import { afterNextRender, ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'nx-mf-df-header',
  imports: [DatePipe, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  readonly lastUpdate = Date.parse('2026-02-16T22:00:00');
  readonly docLocale = signal<'en' | 'hu'>('en');
  readonly docHref = computed(() => `/docs/fe-microfrontend-architecture-proposal_${this.docLocale()}.md`);

  constructor() {
    afterNextRender(() => {
      const lang = typeof navigator !== 'undefined' && navigator.language?.startsWith('hu') ? 'hu' : 'en';
      this.docLocale.set(lang);
    });
  }
}
