import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth-service';
import { provideAppAuth } from './provide-app-auth.production';
import { UnconfiguredAuthService } from './unconfigured-auth-service';

describe('provideAppAuth (production)', () => {
  it('provides UnconfiguredAuthService as AuthService', () => {
    TestBed.configureTestingModule({ providers: [provideAppAuth()] });

    const auth = TestBed.inject(AuthService);

    expect(auth).toBeInstanceOf(UnconfiguredAuthService);
  });
});
