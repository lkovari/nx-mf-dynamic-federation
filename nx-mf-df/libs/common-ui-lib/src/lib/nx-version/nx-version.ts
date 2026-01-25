import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { NX_VERSION } from './nx-version.constant';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'lib-nx-version',
  imports: [NgStyle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nx-version.html',
  styleUrl: './nx-version.scss',
})
export class NxVersion {
  protected readonly nxVersion = signal(NX_VERSION);
  textStyle = input<{ [key: string]: string }>({});
}
