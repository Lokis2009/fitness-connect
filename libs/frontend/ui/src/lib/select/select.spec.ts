import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, disabled, form, readonly, required } from '@angular/forms/signals';
import { FcFormField } from '../form-field/form-field';
import { FcSelect, FcSelectOption } from './select';

const OPTIONS: readonly FcSelectOption[] = [
  { value: '', label: 'All roles' },
  { value: 'client', label: 'Clients' },
  { value: 'trainer', label: 'Trainers' },
];

function nativeSelect(root: HTMLElement): HTMLSelectElement {
  return root.querySelector('select') as HTMLSelectElement;
}

async function choose(fixture: { whenStable(): Promise<unknown> }, select: HTMLSelectElement, value: string) {
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
  await fixture.whenStable();
}

@Component({
  imports: [FcSelect],
  template: `
    <fc-select
      [(value)]="value"
      [options]="options()"
      ariaLabel="Role"
      name="role"
      [disabled]="isDisabled()"
      [required]="isRequired()"
      (touch)="touches.set(touches() + 1)"
    />
  `,
})
class StandaloneHost {
  readonly control = viewChild.required(FcSelect);
  readonly value = signal('');
  readonly options = signal(OPTIONS);
  readonly isDisabled = signal(false);
  readonly isRequired = signal(false);
  readonly touches = signal(0);
}

@Component({
  imports: [FcSelect, FcFormField],
  template: `
    <fc-form-field label="Role" [hint]="hint()" [error]="error()">
      <fc-select [options]="options" />
    </fc-form-field>
  `,
})
class FormFieldHost {
  readonly options = OPTIONS;
  readonly hint = signal('Filters the list');
  readonly error = signal('');
}

@Component({
  imports: [FcSelect, FcFormField, FormField],
  template: `
    <fc-form-field label="Role">
      <fc-select [formField]="filterForm.role" [options]="options" />
    </fc-form-field>
  `,
})
class SignalFormHost {
  readonly control = viewChild.required(FcSelect);
  readonly options = OPTIONS;
  readonly model = signal({ role: '' });
  readonly locked = signal(false);
  readonly frozen = signal(false);
  readonly filterForm = form(this.model, (path) => {
    required(path.role);
    disabled(path.role, () => this.locked());
    readonly(path.role, () => this.frozen());
  });
}

describe('FcSelect', () => {
  describe('on its own', () => {
    async function setup() {
      const fixture = TestBed.createComponent(StandaloneHost);
      await fixture.whenStable();
      const root = fixture.nativeElement as HTMLElement;
      return { fixture, host: fixture.componentInstance, root, select: () => nativeSelect(root) };
    }

    it('renders one native select with an option per entry', async () => {
      const { root, select } = await setup();

      expect(root.querySelectorAll('select')).toHaveLength(1);
      expect(Array.from(select().options).map((o) => [o.value, o.textContent?.trim()])).toEqual([
        ['', 'All roles'],
        ['client', 'Clients'],
        ['trainer', 'Trainers'],
      ]);
    });

    it('applies name and the aria-label as accessible name', async () => {
      const { select } = await setup();

      expect(select().getAttribute('name')).toBe('role');
      expect(select().getAttribute('aria-label')).toBe('Role');
    });

    it('selects the option that matches the value, including the empty value', async () => {
      const { fixture, host, select } = await setup();
      expect(select().selectedOptions[0].textContent?.trim()).toBe('All roles');

      host.value.set('trainer');
      await fixture.whenStable();

      expect(select().value).toBe('trainer');
      expect(select().selectedOptions[0].textContent?.trim()).toBe('Trainers');
    });

    it('writes the chosen option to the value model', async () => {
      const { fixture, host, select } = await setup();

      await choose(fixture, select(), 'client');

      expect(host.value()).toBe('client');
      expect(host.control().value()).toBe('client');
    });

    it('keeps the value selected when the options change', async () => {
      const { fixture, host, select } = await setup();
      host.value.set('client');
      await fixture.whenStable();

      host.options.set([...OPTIONS, { value: 'admin', label: 'Admins' }]);
      await fixture.whenStable();

      expect(select().options).toHaveLength(4);
      expect(select().value).toBe('client');
    });

    it('reflects disabled and required', async () => {
      const { fixture, host, select } = await setup();
      expect(select().disabled).toBe(false);
      expect(select().required).toBe(false);

      host.isDisabled.set(true);
      host.isRequired.set(true);
      await fixture.whenStable();

      expect(select().disabled).toBe(true);
      expect(select().required).toBe(true);
    });

    it('emits touch when the select loses focus, not when it gains it', async () => {
      const { fixture, host, select } = await setup();

      select().dispatchEvent(new Event('focus'));
      await fixture.whenStable();
      expect(host.touches()).toBe(0);

      select().dispatchEvent(new Event('blur'));
      await fixture.whenStable();
      expect(host.touches()).toBe(1);
    });

    it('focuses the native select from focus()', async () => {
      const { host, select } = await setup();

      host.control().focus();

      expect(document.activeElement).toBe(select());
    });
  });

  describe('inside fc-form-field', () => {
    async function setup() {
      const fixture = TestBed.createComponent(FormFieldHost);
      await fixture.whenStable();
      const root = fixture.nativeElement as HTMLElement;
      return { fixture, host: fixture.componentInstance, root, select: () => nativeSelect(root) };
    }

    it('is labelled by the form field label', async () => {
      const { root, select } = await setup();
      const label = root.querySelector('label') as HTMLLabelElement;

      expect(label.getAttribute('for')).toBe(select().id);
      expect(label.control).toBe(select());
    });

    it('is described by the hint and is not invalid by default', async () => {
      const { root, select } = await setup();
      const hint = root.querySelector('[data-fc-hint]') as HTMLElement;

      expect(select().getAttribute('aria-describedby')).toBe(hint.id);
      expect(select().getAttribute('aria-invalid')).toBe('false');
    });

    it('becomes invalid and described by hint and error when the form field shows an error', async () => {
      const { fixture, host, root, select } = await setup();

      host.error.set('Choose a role');
      await fixture.whenStable();
      const hint = root.querySelector('[data-fc-hint]') as HTMLElement;
      const error = root.querySelector('[data-fc-error]') as HTMLElement;

      expect(select().getAttribute('aria-invalid')).toBe('true');
      expect(select().getAttribute('aria-describedby')).toBe(`${hint.id} ${error.id}`);
      expect(root.querySelector('.mat-form-field-invalid')).not.toBeNull();
    });

    it('clears the invalid state when the error goes away', async () => {
      const { fixture, host, select } = await setup();

      host.error.set('Choose a role');
      await fixture.whenStable();
      host.error.set('');
      await fixture.whenStable();

      expect(select().getAttribute('aria-invalid')).toBe('false');
    });
  });

  describe('bound to a signal form', () => {
    async function setup() {
      const fixture = TestBed.createComponent(SignalFormHost);
      await fixture.whenStable();
      const root = fixture.nativeElement as HTMLElement;
      return { fixture, host: fixture.componentInstance, root, select: () => nativeSelect(root) };
    }

    it('writes the chosen option into the form model', async () => {
      const { fixture, host, select } = await setup();

      await choose(fixture, select(), 'trainer');

      expect(host.model().role).toBe('trainer');
    });

    it('shows model changes in the select', async () => {
      const { fixture, host, select } = await setup();

      host.model.set({ role: 'client' });
      await fixture.whenStable();

      expect(select().value).toBe('client');
    });

    it('marks the field as touched on blur', async () => {
      const { fixture, host, select } = await setup();
      expect(host.filterForm.role().touched()).toBe(false);

      select().dispatchEvent(new Event('blur'));
      await fixture.whenStable();

      expect(host.filterForm.role().touched()).toBe(true);
    });

    it('receives the required flag from the schema', async () => {
      const { select } = await setup();

      expect(select().required).toBe(true);
    });

    it('is disabled while the schema disables the field', async () => {
      const { fixture, host, select } = await setup();

      host.locked.set(true);
      await fixture.whenStable();
      expect(select().disabled).toBe(true);

      host.locked.set(false);
      await fixture.whenStable();
      expect(select().disabled).toBe(false);
    });

    it('blocks changes while the schema makes the field read-only', async () => {
      const { fixture, host, select } = await setup();

      host.frozen.set(true);
      await fixture.whenStable();

      expect(select().disabled).toBe(true);
      expect(select().getAttribute('aria-readonly')).toBe('true');
    });

    it('can be focused through the form field state', async () => {
      const { host, select } = await setup();

      host.filterForm.role().focusBoundControl();

      expect(document.activeElement).toBe(select());
    });
  });
});
