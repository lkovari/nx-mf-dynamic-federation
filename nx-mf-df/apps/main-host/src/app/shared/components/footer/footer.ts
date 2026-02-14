import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AngularVersion, NxVersion } from '@nx-mf-df/common-ui-lib';

@Component({
  selector: 'nx-mf-df-footer',
  imports: [NxVersion, AngularVersion],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  protected readonly currentYear = new Date().getFullYear();
  protected readonly versionTextStyle = { color: 'magenta' };
}
