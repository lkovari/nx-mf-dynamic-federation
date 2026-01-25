import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { VERSION } from '@angular/core';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'lib-angular-version',
  imports: [NgStyle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './angular-version.html',
  styleUrl: './angular-version.scss',
})
export class AngularVersion {
  protected readonly angularVersion = signal(VERSION.full);
  textStyle = input<{ [key: string]: string }>({});
}
