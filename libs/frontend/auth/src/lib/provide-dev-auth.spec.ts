import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { User } from '@fitness-connect/data-access';
import { AuthService } from './auth-service';
import { DevAuthService } from './dev-auth-service';
import { provideDevAuth } from './provide-dev-auth';
import { TokenStorage } from './token-storage';

const user: User = {
  id: '6f1c1d4e-7a52-4a39-9d52-1f3c2f6f5a10',
  email: 'trainer@example.com',
  displayName: 'Tara Trainer',
  role: 'trainer',
};

describe('provideDevAuth', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideDevAuth(),
      ],
    });
  });

  it('provides DevAuthService as AuthService', () => {
    const auth = TestBed.inject(AuthService);
    expect(auth).toBeInstanceOf(DevAuthService);
    expect(auth).toBe(TestBed.inject(DevAuthService));
  });

  it('restores the stored session at startup', async () => {
    TestBed.inject(TokenStorage).set('stored-jwt');
    const http = TestBed.inject(HttpTestingController);
    const initialized = TestBed.inject(ApplicationInitStatus).donePromise;

    http.expectOne('/api/v1/me').flush(user);
    await initialized;

    expect(TestBed.inject(AuthService).user()).toEqual(user);
    http.verify();
  });

  it('starts without a request when no session is stored', async () => {
    const http = TestBed.inject(HttpTestingController);
    await TestBed.inject(ApplicationInitStatus).donePromise;

    http.expectNone('/api/v1/me');
    expect(TestBed.inject(AuthService).user()).toBeNull();
  });
});
