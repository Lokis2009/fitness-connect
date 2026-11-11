import { TestBed } from '@angular/core/testing';
import { DevLoginPage, LoginPage, loginRoutes } from '../index';

describe('feature-login skeleton', () => {
  it('exports stubs that are not implemented yet', () => {
    expect(() => loginRoutes({ title: 'T', expectedRole: 'client', homePath: '/' })).toThrow('not implemented');
    expect(() => TestBed.createComponent(LoginPage)).toThrow('not implemented');
    expect(() => TestBed.createComponent(DevLoginPage)).toThrow('not implemented');
  });
});
