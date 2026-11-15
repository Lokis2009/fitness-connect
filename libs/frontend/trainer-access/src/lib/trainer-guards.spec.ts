import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { trainerApprovedGuard, trainerSetupGuard } from './trainer-guards';

const route = {} as ActivatedRouteSnapshot;
const state = { url: '/' } as RouterStateSnapshot;

describe('trainer guards (stubs)', () => {
  it('trainerApprovedGuard is not implemented yet', () => {
    expect(() => trainerApprovedGuard(route, state)).toThrow('not implemented');
  });

  it('trainerSetupGuard is not implemented yet', () => {
    expect(() => trainerSetupGuard(route, state)).toThrow('not implemented');
  });
});
