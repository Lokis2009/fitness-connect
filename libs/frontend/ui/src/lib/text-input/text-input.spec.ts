import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, disabled, email, form, minLength, readonly, required } from '@angular/forms/signals';
import { FcFormField } from '../form-field/form-field';
import { FcTextInput, FcTextInputType } from './text-input';

function nativeInput(root: HTMLElement, selector = 'input'): HTMLInputElement {
  return root.querySelector(selector) as HTMLInputElement;
}

async function type(fixture: { whenStable(): Promise<unknown> }, input: HTMLInputElement, text: string) {
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await fixture.whenStable();
}

@Component({
  imports: [FcTextInput],
  template: `
    <fc-text-input
      [(value)]="value"
      [type]="type()"
      [placeholder]="placeholder()"
      autocomplete="email"
      ariaLabel="Email address"
      name="email"
      [disabled]="isDisabled()"
      [readonly]="isReadonly()"
      [required]="isRequired()"
      [minLength]="2"
      [maxLength]="40"
      (touch)="touches.set(touches() + 1)"
    />
  `,
})
class StandaloneHost {
  readonly control = viewChild.required(FcTextInput);
  readonly value = signal('');
  readonly type = signal<FcTextInputType>('text');
  readonly placeholder = signal('you@example.com');
  readonly isDisabled = signal(false);
  readonly isReadonly = signal(false);
  readonly isRequired = signal(false);
  readonly touches = signal(0);
}

@Component({
  imports: [FcTextInput, FcFormField],
  template: `
    <fc-form-field [label]="'Email'" [hint]="hint()" [error]="error()">
      <fc-text-input />
    </fc-form-field>
  `,
})
class FormFieldHost {
  readonly hint = signal('Used to sign in');
  readonly error = signal('');
}

@Component({
  imports: [FcTextInput, FcFormField, FormField],
  template: `
    <fc-form-field label="Email" [error]="showError() ? 'Enter a valid email' : ''">
      <fc-text-input [formField]="loginForm.email" type="email" />
    </fc-form-field>
  `,
})
class SignalFormHost {
  readonly control = viewChild.required(FcTextInput);
  readonly model = signal({ email: '' });
  readonly locked = signal(false);
  readonly frozen = signal(false);
  readonly loginForm = form(this.model, (path) => {
    required(path.email);
    email(path.email);
    minLength(path.email, 5);
    disabled(path.email, () => this.locked());
    readonly(path.email, () => this.frozen());
  });

  showError() {
    return this.loginForm.email().touched() && this.loginForm.email().invalid();
  }
}

describe('FcTextInput', () => {
  describe('on its own', () => {
    async function setup() {
      const fixture = TestBed.createComponent(StandaloneHost);
      await fixture.whenStable();
      const root = fixture.nativeElement as HTMLElement;
      return { fixture, host: fixture.componentInstance, root, input: () => nativeInput(root) };
    }

    it('renders one native text input with the configured attributes', async () => {
      const { root, input } = await setup();

      expect(root.querySelectorAll('input')).toHaveLength(1);
      expect(input().type).toBe('text');
      expect(input().placeholder).toBe('you@example.com');
      expect(input().getAttribute('autocomplete')).toBe('email');
      expect(input().getAttribute('name')).toBe('email');
      expect(input().getAttribute('minlength')).toBe('2');
      expect(input().getAttribute('maxlength')).toBe('40');
    });

    it('uses the aria-label as accessible name when there is no form field label', async () => {
      const { input } = await setup();

      expect(input().getAttribute('aria-label')).toBe('Email address');
    });

    it('switches the native input type', async () => {
      const { fixture, host, input } = await setup();

      host.type.set('email');
      await fixture.whenStable();

      expect(input().type).toBe('email');
    });

    it('writes typed text to the value model', async () => {
      const { fixture, host, input } = await setup();

      await type(fixture, input(), 'sam@example.com');

      expect(host.value()).toBe('sam@example.com');
      expect(host.control().value()).toBe('sam@example.com');
    });

    it('shows value changes made from outside', async () => {
      const { fixture, host, input } = await setup();

      host.value.set('from outside');
      await fixture.whenStable();

      expect(input().value).toBe('from outside');
    });

    it('reflects disabled, readonly and required', async () => {
      const { fixture, host, input } = await setup();
      expect(input().disabled).toBe(false);
      expect(input().readOnly).toBe(false);
      expect(input().required).toBe(false);

      host.isDisabled.set(true);
      host.isReadonly.set(true);
      host.isRequired.set(true);
      await fixture.whenStable();

      expect(input().disabled).toBe(true);
      expect(input().readOnly).toBe(true);
      expect(input().required).toBe(true);
    });

    it('emits touch when the input loses focus, not when it gains it', async () => {
      const { fixture, host, input } = await setup();

      input().dispatchEvent(new Event('focus'));
      await fixture.whenStable();
      expect(host.touches()).toBe(0);

      input().dispatchEvent(new Event('blur'));
      await fixture.whenStable();
      expect(host.touches()).toBe(1);
    });

    it('focuses the native input from focus()', async () => {
      const { host, input } = await setup();

      host.control().focus();

      expect(document.activeElement).toBe(input());
    });
  });

  describe('inside fc-form-field', () => {
    async function setup() {
      const fixture = TestBed.createComponent(FormFieldHost);
      await fixture.whenStable();
      const root = fixture.nativeElement as HTMLElement;
      return { fixture, host: fixture.componentInstance, root, input: () => nativeInput(root) };
    }

    it('is labelled by the form field label', async () => {
      const { root, input } = await setup();
      const label = root.querySelector('label') as HTMLLabelElement;

      expect(label.getAttribute('for')).toBe(input().id);
      expect(label.control).toBe(input());
    });

    it('is described by the hint and is not invalid by default', async () => {
      const { root, input } = await setup();
      const hint = root.querySelector('[data-fc-hint]') as HTMLElement;

      expect(input().getAttribute('aria-describedby')).toBe(hint.id);
      expect(input().getAttribute('aria-invalid')).toBe('false');
      expect(root.querySelector('.mat-form-field-invalid')).toBeNull();
    });

    it('becomes invalid and described by hint and error when the form field shows an error', async () => {
      const { fixture, host, root, input } = await setup();

      host.error.set('Required');
      await fixture.whenStable();
      const hint = root.querySelector('[data-fc-hint]') as HTMLElement;
      const error = root.querySelector('[data-fc-error]') as HTMLElement;

      expect(input().getAttribute('aria-invalid')).toBe('true');
      expect(input().getAttribute('aria-describedby')).toBe(`${hint.id} ${error.id}`);
      expect(root.querySelector('.mat-form-field-invalid')).not.toBeNull();
    });

    it('clears the invalid state when the error goes away', async () => {
      const { fixture, host, root, input } = await setup();

      host.error.set('Required');
      await fixture.whenStable();
      host.error.set('');
      await fixture.whenStable();

      expect(input().getAttribute('aria-invalid')).toBe('false');
      expect(root.querySelector('.mat-form-field-invalid')).toBeNull();
    });
  });

  describe('bound to a signal form', () => {
    async function setup() {
      const fixture = TestBed.createComponent(SignalFormHost);
      await fixture.whenStable();
      const root = fixture.nativeElement as HTMLElement;
      return { fixture, host: fixture.componentInstance, root, input: () => nativeInput(root) };
    }

    it('writes typed text into the form model', async () => {
      const { fixture, host, input } = await setup();

      await type(fixture, input(), 'sam@example.com');

      expect(host.model().email).toBe('sam@example.com');
      expect(host.loginForm.email().value()).toBe('sam@example.com');
    });

    it('shows model changes in the input', async () => {
      const { fixture, host, input } = await setup();

      host.model.set({ email: 'reset@example.com' });
      await fixture.whenStable();

      expect(input().value).toBe('reset@example.com');
    });

    it('applies the type attribute next to the binding', async () => {
      const { input } = await setup();

      expect(input().type).toBe('email');
    });

    it('marks the field as touched on blur', async () => {
      const { fixture, host, input } = await setup();
      expect(host.loginForm.email().touched()).toBe(false);

      input().dispatchEvent(new Event('blur'));
      await fixture.whenStable();

      expect(host.loginForm.email().touched()).toBe(true);
    });

    it('receives the required flag from the schema', async () => {
      const { input } = await setup();

      expect(input().required).toBe(true);
    });

    it('receives the minimum length from the schema', async () => {
      const { input } = await setup();

      expect(input().getAttribute('minlength')).toBe('5');
    });

    it('is disabled while the schema disables the field', async () => {
      const { fixture, host, input } = await setup();

      host.locked.set(true);
      await fixture.whenStable();
      expect(input().disabled).toBe(true);

      host.locked.set(false);
      await fixture.whenStable();
      expect(input().disabled).toBe(false);
    });

    it('is read-only while the schema makes the field read-only', async () => {
      const { fixture, host, input } = await setup();

      host.frozen.set(true);
      await fixture.whenStable();

      expect(input().readOnly).toBe(true);
    });

    it('can be focused through the form field state', async () => {
      const { host, input } = await setup();

      host.loginForm.email().focusBoundControl();

      expect(document.activeElement).toBe(input());
    });

    it('shows the validation error through the form field once the field was touched', async () => {
      const { fixture, host, root, input } = await setup();
      await type(fixture, input(), 'nope');
      expect(root.querySelector('[data-fc-error]')).toBeNull();

      input().dispatchEvent(new Event('blur'));
      await fixture.whenStable();

      expect(host.loginForm.email().invalid()).toBe(true);
      expect(root.querySelector('[data-fc-error]')?.textContent).toContain('Enter a valid email');
      expect(input().getAttribute('aria-invalid')).toBe('true');
    });
  });
});
