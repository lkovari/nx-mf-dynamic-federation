import { Component } from '@angular/core';
import { NxWelcome } from './nx-welcome';

@Component({
  imports: [NxWelcome],
  selector: 'nx-mf-df-mf_remote_home-entry',
  template: `<nx-mf-df-nx-welcome></nx-mf-df-nx-welcome>`,
})
export class RemoteEntry {}
