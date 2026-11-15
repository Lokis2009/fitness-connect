import { TestBed } from '@angular/core/testing';
import { TrainerHome } from './trainer-home';

describe('TrainerHome (placeholder)', () => {
  it('renders the placeholder', () => {
    const fixture = TestBed.createComponent(TrainerHome);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Trainer home');
  });
});
