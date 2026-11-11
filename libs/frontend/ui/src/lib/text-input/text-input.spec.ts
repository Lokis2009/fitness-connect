import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FcTextInput } from './text-input';

@Component({
  imports: [FcTextInput],
  template: `<fc-text-input />`,
})
class Host {
  readonly input = viewChild.required(FcTextInput);
}

describe('FcTextInput skeleton', () => {
  it('can be created, and focus is a stub that throws until implemented', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const input = fixture.componentInstance.input();
    expect(input.value()).toBe('');
    expect(() => input.focus()).toThrow('not implemented');
  });
});
