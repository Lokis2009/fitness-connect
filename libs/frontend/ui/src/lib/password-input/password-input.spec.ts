import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, disabled, form, minLength, required } from '@angular/forms/signals';
import { FcFormField } from '../form-field/form-field';
import { FcPasswordInput } from './password-input';

function nativeInput(root: HTMLElement): HTMLInputElement {
  return root.querySelector('input') as HTMLInputElement;
}

function toggleButton(root: HTMLElement): HTMLButtonElement {
  return root.querySelector('button') as HTMLButtonElement;
}

async function type(fixture: { whenStable(): Promise<unknown> }, input: HTMLInputElement, text: string) {
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await fixture.whenStable();
}

@Component({
  imports: [FcPasswordInput],
  template: `
    <fc-password-input
      [(value)]="value"
      [disabled]="isDisabled()"
      [toggleLabel]="toggleLabel()"
      [autocomplete]="autocomplete()"
      ariaLabel="Account password"
      name="password"
      placeholder="Your password"
      (touch)="touches.set(touches() + 1)"
    />
  `,
})
class StandaloneHost {
  readonly control = viewChild.required(FcPasswordInput);
  readonly value = signal('');
  readonly isDisabled = signal(false);
  readonly toggleLabel = signal('Show password');
  readonly autocomplete = signal('current-password');
  readonly touches = signal(0);
}

@Component({
  imports: [FcPasswordInput],
  template: `<fc-password-input />`,
})
class DefaultsHost {}

@Component({
  imports: [FcPasswordInput, FcFormField],
  template: `
    <fc-form-field label="Password" [hint]="'At least 8 characters'" [error]="error()">
      <fc-password-input />
    </fc-form-field>
  `,
})
class FormFieldHost {
  readonly error = signal('');
}

@Component({
  imports: [FcPasswordInput, FcFormField, FormField],
  template: `
    <fc-form-field label="Password" [error]="loginForm.password().touched() && loginForm.password().invalid() ? 'Too short' : ''">
      <fc-password-input [formField]="loginForm.password" />
    </fc-form-field>
  `,
})
class SignalFormHost {
  readonly model = signal({ password: '' });
  readonly locked = signal(false);
  readonly loginForm = form(this.model, (path) => {
    required(path.password);
    minLength(path.password, 8);
    disabled(path.password, () => this.locked());
  });
}

describe('FcPasswordInput', () => {
  describe('on its own', () => {
    async function setup() {
      const fixture = TestBed.createComponent(StandaloneHost);
      await fixture.whenStable();
      const root = fixture.nativeElement as HTMLElement;
      return {
        fixture,
        host: fixture.componentInstance,
        root,
        input: () => nativeInput(root),
        toggle: () => toggleButton(root),
      };
    }

    it('renders a masked password input', async () => {
      const { input } = await setup();

      expect(input().type).toBe('password');
      expect(input().placeholder).toBe('Your password');
      expect(input().getAttribute('name')).toBe('password');
      expect(input().getAttribute('aria-label')).toBe('Account password');
    });

    it('offers a toggle button with an accessible name and a pressed state', async () => {
      const { root, toggle } = await setup();

      expect(root.querySelectorAll('button')).toHaveLength(1);
      expect(toggle().getAttribute('aria-label')).toBe('Show password');
      expect(toggle().getAttribute('aria-pressed')).toBe('false');
    });

    it('never submits an enclosing form and hides its decorative icon from assistive technology', async () => {
      const { toggle } = await setup();

      expect(toggle().type).toBe('button');
      expect(toggle().querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    });

    it('is reachable by keyboard: it comes after the input in the tab order and is not removed from it', async () => {
      const { input, toggle } = await setup();

      expect(toggle().tabIndex).toBeGreaterThanOrEqual(0);
      expect(input().compareDocumentPosition(toggle()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('reveals the password when the toggle is pressed and masks it again on the second press', async () => {
      const { fixture, input, toggle } = await setup();

      toggle().click();
      await fixture.whenStable();
      expect(input().type).toBe('text');
      expect(toggle().getAttribute('aria-pressed')).toBe('true');
      expect(toggle().getAttribute('aria-label')).toBe('Show password');

      toggle().click();
      await fixture.whenStable();
      expect(input().type).toBe('password');
      expect(toggle().getAttribute('aria-pressed')).toBe('false');
    });

    it('keeps the typed value when toggling', async () => {
      const { fixture, host, input, toggle } = await setup();
      await type(fixture, input(), 'hunter2!');

      toggle().click();
      await fixture.whenStable();

      expect(input().value).toBe('hunter2!');
      expect(host.value()).toBe('hunter2!');
    });

    it('uses a custom toggle label', async () => {
      const { fixture, host, toggle } = await setup();

      host.toggleLabel.set('Passwort anzeigen');
      await fixture.whenStable();

      expect(toggle().getAttribute('aria-label')).toBe('Passwort anzeigen');
    });

    it('writes typed text to the value model and shows outside changes', async () => {
      const { fixture, host, input } = await setup();

      await type(fixture, input(), 'secret');
      expect(host.value()).toBe('secret');

      host.value.set('replaced');
      await fixture.whenStable();
      expect(input().value).toBe('replaced');
    });

    it('disables the input and the toggle together', async () => {
      const { fixture, host, input, toggle } = await setup();

      host.isDisabled.set(true);
      await fixture.whenStable();

      expect(input().disabled).toBe(true);
      expect(toggle().disabled).toBe(true);
    });

    it('emits touch when the input loses focus', async () => {
      const { fixture, host, input } = await setup();

      input().dispatchEvent(new Event('blur'));
      await fixture.whenStable();

      expect(host.touches()).toBe(1);
    });

    it('focuses the native input from focus()', async () => {
      const { host, input } = await setup();

      host.control().focus();

      expect(document.activeElement).toBe(input());
    });

    it('lets the caller choose the autocomplete hint', async () => {
      const { fixture, host, input } = await setup();
      expect(input().getAttribute('autocomplete')).toBe('current-password');

      host.autocomplete.set('new-password');
      await fixture.whenStable();

      expect(input().getAttribute('autocomplete')).toBe('new-password');
    });
  });

  it('asks the browser for the saved password by default', async () => {
    const fixture = TestBed.createComponent(DefaultsHost);
    await fixture.whenStable();

    expect(nativeInput(fixture.nativeElement).getAttribute('autocomplete')).toBe('current-password');
  });

  describe('inside fc-form-field', () => {
    async function setup() {
      const fixture = TestBed.createComponent(FormFieldHost);
      await fixture.whenStable();
      const root = fixture.nativeElement as HTMLElement;
      return { fixture, host: fixture.componentInstance, root, input: () => nativeInput(root) };
    }

    it('is labelled by the form field label and described by the hint', async () => {
      const { root, input } = await setup();
      const label = root.querySelector('label') as HTMLLabelElement;
      const hint = root.querySelector('[data-fc-hint]') as HTMLElement;

      expect(label.control).toBe(input());
      expect(input().getAttribute('aria-describedby')).toBe(hint.id);
      expect(input().getAttribute('aria-invalid')).toBe('false');
    });

    it('is invalid and described by the error when the form field shows one', async () => {
      const { fixture, host, root, input } = await setup();

      host.error.set('Wrong password');
      await fixture.whenStable();
      const error = root.querySelector('[data-fc-error]') as HTMLElement;

      expect(input().getAttribute('aria-invalid')).toBe('true');
      expect(input().getAttribute('aria-describedby')).toContain(error.id);
      expect(root.querySelector('.mat-form-field-invalid')).not.toBeNull();
    });

    it('does not use the toggle button as the label target', async () => {
      const { root, input } = await setup();
      const label = root.querySelector('label') as HTMLLabelElement;

      expect(label.getAttribute('for')).toBe(input().id);
      expect(toggleButton(root).id).not.toBe(input().id);
    });
  });

  describe('bound to a signal form', () => {
    async function setup() {
      const fixture = TestBed.createComponent(SignalFormHost);
      await fixture.whenStable();
      const root = fixture.nativeElement as HTMLElement;
      return { fixture, host: fixture.componentInstance, root, input: () => nativeInput(root) };
    }

    it('writes typed text into the form model and shows model changes', async () => {
      const { fixture, host, input } = await setup();

      await type(fixture, input(), 'correct horse');
      expect(host.model().password).toBe('correct horse');

      host.model.set({ password: 'battery staple' });
      await fixture.whenStable();
      expect(input().value).toBe('battery staple');
    });

    it('marks the field as touched on blur and then shows the validation error', async () => {
      const { fixture, host, root, input } = await setup();
      await type(fixture, input(), 'short');
      expect(host.loginForm.password().touched()).toBe(false);
      expect(root.querySelector('[data-fc-error]')).toBeNull();

      input().dispatchEvent(new Event('blur'));
      await fixture.whenStable();

      expect(host.loginForm.password().touched()).toBe(true);
      expect(root.querySelector('[data-fc-error]')?.textContent).toContain('Too short');
      expect(input().getAttribute('aria-invalid')).toBe('true');
    });

    it('receives required and minimum length from the schema', async () => {
      const { input } = await setup();

      expect(input().required).toBe(true);
      expect(input().getAttribute('minlength')).toBe('8');
    });

    it('disables the input and the toggle while the schema disables the field', async () => {
      const { fixture, host, root, input } = await setup();

      host.locked.set(true);
      await fixture.whenStable();

      expect(input().disabled).toBe(true);
      expect(toggleButton(root).disabled).toBe(true);
    });

    it('can be focused through the form field state', async () => {
      const { host, input } = await setup();

      host.loginForm.password().focusBoundControl();

      expect(document.activeElement).toBe(input());
    });
  });
});
