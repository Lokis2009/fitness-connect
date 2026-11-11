import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FcButton } from './button';

@Component({
  imports: [FcButton],
  template: `
    <fc-button variant="secondary" type="submit" [disabled]="true">Book</fc-button>
    <fc-button>Default</fc-button>
  `,
})
class Host {}

describe('FcButton', () => {
  it('projects content and forwards type and disabled to the inner button', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const [first, second] = Array.from<HTMLButtonElement>(
      fixture.nativeElement.querySelectorAll('fc-button button'),
    );
    expect(first.textContent).toContain('Book');
    expect(first.type).toBe('submit');
    expect(first.disabled).toBe(true);
    expect(first.classList.contains('mat-mdc-outlined-button')).toBe(true);

    expect(second.type).toBe('button');
    expect(second.disabled).toBe(false);
    expect(second.classList.contains('mat-mdc-unelevated-button')).toBe(true);
  });
});
