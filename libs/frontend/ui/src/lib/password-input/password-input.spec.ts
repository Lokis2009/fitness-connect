import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FcPasswordInput } from './password-input';

@Component({
  imports: [FcPasswordInput],
  template: `<fc-password-input />`,
})
class Host {
  readonly input = viewChild.required(FcPasswordInput);
}

describe('FcPasswordInput skeleton', () => {
  it('can be created, and toggling is a stub that throws until implemented', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const input = fixture.componentInstance.input();
    expect(input.visible()).toBe(false);
    expect(() => input.toggleVisibility()).toThrow('not implemented');
  });
});
