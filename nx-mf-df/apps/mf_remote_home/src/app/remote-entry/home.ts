import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AngularVersion, NxVersion } from '@nx-mf-df/common-ui-lib';

@Component({
  selector: 'nx-mf-df-home',
  imports: [AngularVersion, NxVersion],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  protected readonly versionTextStyle = { color: 'magenta' };
}
