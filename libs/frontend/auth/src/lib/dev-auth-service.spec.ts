import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ApiError, type DevLoginResponse, type User } from '@fitness-connect/data-access';
import { InvalidCredentialsError, WrongRoleError } from './auth-errors';
import { AuthService } from './auth-service';
import { DevAuthService } from './dev-auth-service';
import { TokenStorage } from './token-storage';

const trainer: User = {
  id: '6f1c1d4e-7a52-4a39-9d52-1f3c2f6f5a10',
  email: 'trainer@example.com',
  displayName: 'Tara Trainer',
  role: 'trainer',
};
const client: User = {
  id: '0c9d2b7e-1c3a-4b51-8f43-5d7a9a1e2b33',
  email: 'client@example.com',
  displayName: 'Casey Client',
  role: 'client',
};

const problem = { type: 'about:blank', title: 'Unauthorized', status: 401 };

describe('DevAuthService', () => {
  let auth: DevAuthService;
  let storage: TokenStorage;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'dev-login', children: [] },
          { path: 'login', children: [] },
        ]),
      ],
    });
    auth = TestBed.inject(DevAuthService);
    storage = TestBed.inject(TokenStorage);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => http.verify());

  function loginResponse(user: User, accessToken = 'jwt'): DevLoginResponse {
    return { accessToken, user };
  }

  it('implements the AuthService contract', () => {
    expect(auth).toBeInstanceOf(AuthService);
  });

  it('starts signed out', () => {
    expect(auth.user()).toBeNull();
    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.accessToken()).toBeNull();
  });

  describe('signIn', () => {
    it('navigates to /dev-login and keeps the return URL', async () => {
      auth.signIn('/trainers?page=2');
      await TestBed.inject(ApplicationRef).whenStable();
      expect(router.url).toBe('/dev-login?returnUrl=%2Ftrainers%3Fpage%3D2');
    });

    it('navigates to a plain /dev-login without a return URL', async () => {
      auth.signIn();
      await TestBed.inject(ApplicationRef).whenStable();
      expect(router.url).toBe('/dev-login');
    });
  });

  describe('login', () => {
    it('posts the credentials, stores the token and sets the user', async () => {
      const result = auth.login(trainer.email, 'secret');
      const req = http.expectOne('/api/v1/dev/login');
      expect(req.request.body).toEqual({ email: trainer.email, password: 'secret' });
      req.flush(loginResponse(trainer));

      expect(await result).toEqual(trainer);
      expect(auth.user()).toEqual(trainer);
      expect(auth.isAuthenticated()).toBe(true);
      expect(auth.accessToken()).toBe('jwt');
      expect(storage.get()).toBe('jwt');
      expect(Object.values(sessionStorage)).toContain('jwt');
    });

    it('accepts a user whose role matches the expected role', async () => {
      const result = auth.login(trainer.email, 'secret', 'trainer');
      http.expectOne('/api/v1/dev/login').flush(loginResponse(trainer));
      expect(await result).toEqual(trainer);
      expect(auth.user()).toEqual(trainer);
    });

    it('throws InvalidCredentialsError on 401 and stays signed out', async () => {
      const result = auth.login(trainer.email, 'wrong');
      http.expectOne('/api/v1/dev/login').flush(problem, { status: 401, statusText: 'Unauthorized' });

      await expect(result).rejects.toBeInstanceOf(InvalidCredentialsError);
      expect(auth.user()).toBeNull();
      expect(auth.accessToken()).toBeNull();
    });

    it('rethrows other API failures as ApiError', async () => {
      const result = auth.login(trainer.email, 'secret');
      http
        .expectOne('/api/v1/dev/login')
        .flush({ ...problem, status: 500, title: 'Internal Server Error' }, { status: 500, statusText: 'Server Error' });

      const error = await result.catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(500);
      expect(auth.user()).toBeNull();
    });

    it('throws WrongRoleError and signs out when the role differs', async () => {
      const result = auth.login(client.email, 'secret', 'trainer');
      http.expectOne('/api/v1/dev/login').flush(loginResponse(client));

      const error = await result.catch((e: unknown) => e);
      expect(error).toBeInstanceOf(WrongRoleError);
      expect((error as WrongRoleError).expected).toBe('trainer');
      expect((error as WrongRoleError).actual).toBe('client');
      expect(auth.user()).toBeNull();
      expect(auth.isAuthenticated()).toBe(false);
      expect(storage.get()).toBeNull();
      expect(sessionStorage.length).toBe(0);
    });

    it('ends an earlier session when a wrong-role login happens', async () => {
      const first = auth.login(trainer.email, 'secret');
      http.expectOne('/api/v1/dev/login').flush(loginResponse(trainer, 'first'));
      await first;

      const second = auth.login(client.email, 'secret', 'trainer');
      http.expectOne('/api/v1/dev/login').flush(loginResponse(client, 'second'));
      await expect(second).rejects.toBeInstanceOf(WrongRoleError);

      expect(auth.user()).toBeNull();
      expect(auth.accessToken()).toBeNull();
    });
  });

  describe('signOut', () => {
    it('clears the user and the stored token', async () => {
      const result = auth.login(trainer.email, 'secret');
      http.expectOne('/api/v1/dev/login').flush(loginResponse(trainer));
      await result;

      auth.signOut();

      expect(auth.user()).toBeNull();
      expect(auth.isAuthenticated()).toBe(false);
      expect(auth.accessToken()).toBeNull();
      expect(sessionStorage.length).toBe(0);
    });
  });

  describe('restoreSession', () => {
    it('does nothing without a stored token', async () => {
      await auth.restoreSession();
      http.expectNone('/api/v1/me');
      expect(auth.user()).toBeNull();
    });

    it('loads the user for a valid stored token', async () => {
      storage.set('stored-jwt');

      const done = auth.restoreSession();
      const req = http.expectOne('/api/v1/me');
      expect(req.request.method).toBe('GET');
      req.flush(trainer);
      await done;

      expect(auth.user()).toEqual(trainer);
      expect(auth.isAuthenticated()).toBe(true);
      expect(auth.accessToken()).toBe('stored-jwt');
    });

    it('clears an invalid token and resolves without throwing', async () => {
      storage.set('stale-jwt');

      const done = auth.restoreSession();
      http.expectOne('/api/v1/me').flush(problem, { status: 401, statusText: 'Unauthorized' });
      await expect(done).resolves.toBeUndefined();

      expect(auth.user()).toBeNull();
      expect(auth.accessToken()).toBeNull();
      expect(sessionStorage.length).toBe(0);
    });
  });
});
