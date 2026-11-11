import { Component, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FC_FORM_FIELD, FcFormField } from './form-field';

/** Minimal control that applies the form field context the way the real inputs do. */
@Component({
  selector: 'fc-probe-control',
  template: `
    <input
      [id]="field.controlId"
      [attr.aria-describedby]="field.describedBy()"
      [attr.aria-invalid]="field.invalid()"
    />
  `,
})
class ProbeControl {
  protected readonly field = inject(FC_FORM_FIELD);
}

@Component({
  imports: [FcFormField, ProbeControl],
  template: `
    <fc-form-field id="plain" label="Name"><fc-probe-control /></fc-form-field>
    <fc-form-field id="full" [label]="label()" [hint]="hint()" [error]="error()">
      <fc-probe-control />
    </fc-form-field>
  `,
})
class Host {
  readonly label = signal('Email');
  readonly hint = signal('We never share it');
  readonly error = signal('');
}

describe('FcFormField', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const parts = (id: string) => {
      const field = root.querySelector(`#${id}`) as HTMLElement;
      return {
        label: field.querySelector('label') as HTMLLabelElement,
        input: field.querySelector('input') as HTMLInputElement,
        hint: field.querySelector('[data-fc-hint]') as HTMLElement | null,
        error: field.querySelector('[data-fc-error]') as HTMLElement | null,
        live: field.querySelector('[aria-live]') as HTMLElement | null,
      };
    };
    const update = async (change: () => void) => {
      change();
      await fixture.whenStable();
    };
    return { host: fixture.componentInstance, parts, update };
  }

  it('shows the label and ties it to the projected control through for/id', async () => {
    const { parts } = await setup();
    const { label, input } = parts('full');

    expect(label.textContent?.trim()).toBe('Email');
    expect(input.id).not.toBe('');
    expect(label.getAttribute('for')).toBe(input.id);
    expect(label.control).toBe(input);
  });

  it('styles the label with the label type step', async () => {
    const { parts } = await setup();
    const { label } = parts('full');

    expect(label.classList).toContain('text-label');
    expect(label.classList).toContain('text-ink');
    expect(label.classList).toContain('mb-label');
  });

  it('gives every field its own control id', async () => {
    const { parts } = await setup();

    expect(parts('plain').input.id).not.toBe(parts('full').input.id);
  });

  it('updates the label text when the input changes', async () => {
    const { host, parts, update } = await setup();

    await update(() => host.label.set('Work email'));

    expect(parts('full').label.textContent?.trim()).toBe('Work email');
  });

  it('adds no description and no invalid state when there is no hint or error', async () => {
    const { parts } = await setup();
    const { input, hint, error } = parts('plain');

    expect(hint).toBeNull();
    expect(error).toBeNull();
    expect(input.hasAttribute('aria-describedby')).toBe(false);
    expect(input.getAttribute('aria-invalid')).toBe('false');
  });

  it('describes the control with the hint', async () => {
    const { parts } = await setup();
    const { input, hint } = parts('full');

    expect(hint?.textContent?.trim()).toBe('We never share it');
    expect(hint?.id).not.toBe('');
    expect(input.getAttribute('aria-describedby')).toBe(hint?.id);
    expect(input.getAttribute('aria-invalid')).toBe('false');
  });

  it('marks the control invalid and describes it with the hint and the error', async () => {
    const { host, parts, update } = await setup();

    await update(() => host.error.set('Enter a valid email'));
    const { input, hint, error } = parts('full');

    expect(error?.textContent?.trim()).toBe('Enter a valid email');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe(`${hint?.id} ${error?.id}`);
  });

  it('describes the control with the error only when there is no hint', async () => {
    const { host, parts, update } = await setup();

    await update(() => {
      host.hint.set('');
      host.error.set('Required');
    });
    const { input, error } = parts('full');

    expect(input.getAttribute('aria-describedby')).toBe(error?.id);
  });

  it('removes the error and the invalid state once the error is cleared', async () => {
    const { host, parts, update } = await setup();

    await update(() => host.error.set('Required'));
    await update(() => host.error.set(''));
    const { input, error, hint } = parts('full');

    expect(error).toBeNull();
    expect(input.getAttribute('aria-invalid')).toBe('false');
    expect(input.getAttribute('aria-describedby')).toBe(hint?.id);
  });

  it('keeps a polite live region so a new error is announced', async () => {
    const { host, parts, update } = await setup();

    expect(parts('full').live?.getAttribute('aria-live')).toBe('polite');
    expect(parts('full').live?.contains(parts('full').error)).toBe(false);

    await update(() => host.error.set('Required'));

    expect(parts('full').live?.contains(parts('full').error)).toBe(true);
  });
});
