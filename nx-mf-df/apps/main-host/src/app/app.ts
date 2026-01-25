import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Header } from './shared/components/header/header';
import { Footer } from './shared/components/footer/footer';
import { Main } from './shared/components/main/main';

@Component({
  selector: 'nx-mf-df-root',
  imports: [Header, Footer, Main],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
