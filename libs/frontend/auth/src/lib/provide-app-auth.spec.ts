import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth-service';
import { DevAuthService } from './dev-auth-service';
import { provideAppAuth } from './provide-app-auth';

describe('provideAppAuth (development)', () => {
  it('provides DevAuthService as AuthService', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideAppAuth(),
      ],
    });

    expect(TestBed.inject(AuthService)).toBeInstanceOf(DevAuthService);
  });
});
