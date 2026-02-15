import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  selector: 'nx-mf-df-remote-b',
  templateUrl: './remote-b.html',
  styleUrl: './remote-b.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemoteB {
  readonly videoOverlayOpen = signal(false);

  openVideoOverlay(): void {
    this.videoOverlayOpen.set(true);
  }

  closeVideoOverlay(): void {
    this.videoOverlayOpen.set(false);
  }
}
