import { devLoginRoutes } from './dev-login-routes.production';

describe('devLoginRoutes (production)', () => {
  it('has no routes, so there is no dev login in production builds', () => {
    expect(devLoginRoutes({ any: 'data' })).toEqual([]);
  });
});
