import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from './api-error';
import type { Problem } from './api-types';

const problem: Problem = {
  type: 'https://fitness-connect.dev/problems/unauthorized',
  title: 'Unauthorized',
  status: 401,
  detail: 'Token expired',
  instance: '/v1/me',
};

describe('ApiError', () => {
  it('uses the problem detail as message, falling back to the title', () => {
    expect(new ApiError(401, problem).message).toBe('Token expired');
    expect(new ApiError(401, { ...problem, detail: undefined }).message).toBe('Unauthorized');
  });

  it('is an Error with a stable name', () => {
    const error = new ApiError(401, problem);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.name).toBe('ApiError');
  });

  describe('from', () => {
    it('maps an HTTP error with a problem body', () => {
      const cause = new HttpErrorResponse({ status: 401, error: problem });
      const error = ApiError.from(cause);
      expect(error.status).toBe(401);
      expect(error.problem).toEqual(problem);
      expect(error.cause).toBe(cause);
    });

    it('synthesizes a problem when the body is not problem details', () => {
      const error = ApiError.from(
        new HttpErrorResponse({ status: 502, statusText: 'Bad Gateway', error: '<html>oops</html>' }),
      );
      expect(error.status).toBe(502);
      expect(error.problem.status).toBe(502);
      expect(error.problem.title).toBe('Bad Gateway');
      expect(error.problem.type).toBe('about:blank');
    });

    it('synthesizes a problem when the body is null', () => {
      const error = ApiError.from(new HttpErrorResponse({ status: 500, error: null }));
      expect(error.status).toBe(500);
      expect(error.problem.status).toBe(500);
      expect(error.problem.title).toBeTruthy();
    });

    it('maps a network failure to status 0', () => {
      const error = ApiError.from(
        new HttpErrorResponse({ status: 0, error: new ProgressEvent('error') }),
      );
      expect(error.status).toBe(0);
      expect(error.problem.status).toBe(0);
      expect(error.problem.title).toBe('Network error');
    });

    it('returns an existing ApiError unchanged', () => {
      const existing = new ApiError(401, problem);
      expect(ApiError.from(existing)).toBe(existing);
    });

    it('maps any other thrown value to status 0', () => {
      const cause = new Error('boom');
      const error = ApiError.from(cause);
      expect(error.status).toBe(0);
      expect(error.problem.detail).toBe('boom');
      expect(error.cause).toBe(cause);
      expect(ApiError.from('weird').problem.title).toBe('Unexpected error');
    });
  });
});
