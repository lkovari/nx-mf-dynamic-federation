import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NxVersion } from './nx-version';

describe('NxVersion', () => {
  let component: NxVersion;
  let fixture: ComponentFixture<NxVersion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NxVersion],
    }).compileComponents();

    fixture = TestBed.createComponent(NxVersion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display Nx version', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const versionText = compiled.querySelector('.version-number')?.textContent;
    expect(versionText).toBeTruthy();
    expect(versionText).toContain('22.');
  });
});
