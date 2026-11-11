import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form, required } from '@angular/forms/signals';
import { FcButton } from '../button/button';
import { FcFormField } from '../form-field/form-field';
import { FcTextInput } from '../text-input/text-input';
import { FcForm } from './form';

@Component({
  imports: [FcForm, FcFormField, FcTextInput, FcButton, FormField],
  template: `
    <fc-form [form]="loginForm">
      <fc-form-field label="Name">
        <fc-text-input [formField]="loginForm.name" />
      </fc-form-field>
      <fc-button type="submit">Save</fc-button>
    </fc-form>
  `,
})
class Host {
  readonly model = signal({ name: '' });
  readonly submitted = signal<string[]>([]);
  readonly invalidAttempts = signal(0);
  readonly loginForm = form(
    this.model,
    (path) => {
      required(path.name);
    },
    {
      submission: {
        action: async (field) => {
          this.submitted.update((all) => [...all, field().value().name]);
          return undefined;
        },
        onInvalid: () => this.invalidAttempts.update((n) => n + 1),
      },
    },
  );
}

describe('FcForm', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const nativeForm = root.querySelector('form') as HTMLFormElement;
    const input = root.querySelector('input') as HTMLInputElement;
    const type = async (text: string) => {
      input.value = text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await fixture.whenStable();
    };
    const submit = async () => {
      const event = new Event('submit', { bubbles: true, cancelable: true });
      nativeForm.dispatchEvent(event);
      await fixture.whenStable();
      return event;
    };
    return { fixture, root, nativeForm, input, type, submit };
  }

  it('renders a native form around its projected content', async () => {
    const { nativeForm, root } = await setup();

    expect(nativeForm).not.toBeNull();
    expect(nativeForm.contains(root.querySelector('fc-form-field'))).toBe(true);
    expect(nativeForm.contains(root.querySelector('button[type="submit"]'))).toBe(true);
  });

  it('disables browser validation, because validation belongs to the field tree', async () => {
    const { nativeForm } = await setup();

    expect(nativeForm.noValidate).toBe(true);
  });

  it('runs the submission action with the form value and prevents the native submit', async () => {
    const { fixture, type, submit } = await setup();
    await type('Anna');

    const event = await submit();

    expect(event.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.submitted()).toEqual(['Anna']);
  });

  it('calls onInvalid instead of the action while the form is invalid', async () => {
    const { fixture, submit } = await setup();

    await submit();

    expect(fixture.componentInstance.submitted()).toEqual([]);
    expect(fixture.componentInstance.invalidAttempts()).toBe(1);
  });

  it('marks all fields as touched when submitting an invalid form', async () => {
    const { fixture, submit } = await setup();

    await submit();

    expect(fixture.componentInstance.loginForm.name().touched()).toBe(true);
  });

  it('submits when the submit button is clicked', async () => {
    const { fixture, root, type } = await setup();
    await type('Bo');

    (root.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(fixture.componentInstance.submitted()).toEqual(['Bo']);
  });
});
