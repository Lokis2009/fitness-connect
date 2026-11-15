import { TestBed } from '@angular/core/testing';
import { TrainerSetup } from './trainer-setup';

describe('TrainerSetup (placeholder)', () => {
  it('renders the placeholder', () => {
    const fixture = TestBed.createComponent(TrainerSetup);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Trainer setup');
  });
});
