import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AngularVersionComponent } from './angular-version';

describe('AngularVersionComponent', () => {
  let component: AngularVersionComponent;
  let fixture: ComponentFixture<AngularVersionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AngularVersionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AngularVersionComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display Angular version', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const versionText = compiled.querySelector('.version-number')?.textContent;
    expect(versionText).toBeTruthy();
    expect(versionText).toContain('21.');
    expect(versionText).not.toContain('Angular Version:');
  });
});
