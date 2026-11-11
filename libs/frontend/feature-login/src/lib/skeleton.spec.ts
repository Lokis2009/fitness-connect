import { TestBed } from '@angular/core/testing';
import { DevLoginPage, LoginPage, loginRoutes } from '../index';
import { injectLoginConfig } from './login-config';
import { resolveReturnUrl } from './return-url';

describe('feature-login skeleton', () => {
  it('exports stubs that are not implemented yet', () => {
    expect(() => loginRoutes({ title: 'T', expectedRole: 'client', homePath: '/' })).toThrow('not implemented');
    expect(() => resolveReturnUrl('/a', '/')).toThrow('not implemented');
    expect(() => TestBed.runInInjectionContext(() => injectLoginConfig())).toThrow('not implemented');
    expect(() => TestBed.createComponent(LoginPage)).toThrow('not implemented');
    expect(() => TestBed.createComponent(DevLoginPage)).toThrow('not implemented');
  });
});
