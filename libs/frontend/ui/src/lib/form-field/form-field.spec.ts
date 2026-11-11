import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FcFormField } from './form-field';

@Component({
  imports: [FcFormField],
  template: `<fc-form-field label="Email" />`,
})
class Host {
  readonly field = viewChild.required(FcFormField);
}

describe('FcFormField skeleton', () => {
  it('can be created, and the wiring is a stub that throws until implemented', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const field = fixture.componentInstance.field();
    expect(field.controlId).toMatch(/^fc-form-field-\d+-control$/);
    expect(() => field.describedBy()).toThrow('not implemented');
    expect(() => field.invalid()).toThrow('not implemented');
  });
});
