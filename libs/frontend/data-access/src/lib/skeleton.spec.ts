// Temporary: proves the skeleton stubs fail loudly. Replaced by the real specs in the next commit.
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL, ApiClient } from './api-client';
import { ApiError } from './api-error';

describe('data-access skeleton', () => {
  it('ApiClient methods are not implemented', () => {
    const api = TestBed.inject(ApiClient);
    expect(() => api.getHealth()).toThrow('not implemented');
    expect(() => api.getMe()).toThrow('not implemented');
    expect(() => api.devLogin({ email: 'a@b.c', password: 'x' })).toThrow('not implemented');
  });

  it('API_BASE_URL defaults to /api/v1', () => {
    expect(TestBed.inject(API_BASE_URL)).toBe('/api/v1');
  });

  it('ApiError carries status and problem', () => {
    const problem = { type: 'about:blank', title: 'Unauthorized', status: 401 };
    expect(new ApiError(401, problem).message).toBe('Unauthorized');
    expect(new ApiError(401, { ...problem, detail: 'Bad token' }).message).toBe('Bad token');
  });

  it('ApiError.from is not implemented', () => {
    expect(() => ApiError.from(new Error('x'))).toThrow('not implemented');
  });
});
