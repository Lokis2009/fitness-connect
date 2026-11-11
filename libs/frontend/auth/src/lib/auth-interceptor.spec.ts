import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ApplicationRef, type Provider, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '@fitness-connect/data-access';
import { authInterceptor } from './auth-interceptor';
import { AuthService } from './auth-service';

describe('authInterceptor', () => {
  const token = signal<string | null>(null);
  const authenticated = signal(false);
  const signOut = vi.fn();

  let client: HttpClient;
  let http: HttpTestingController;
  let router: Router;

  function configure(extraProviders: Provider[] = []): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'login', children: [] },
          { path: 'trainers', children: [] },
        ]),
        {
          provide: AuthService,
          useValue: {
            accessToken: () => token(),
            isAuthenticated: authenticated,
            signOut,
          },
        },
        ...extraProviders,
      ],
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  }

  beforeEach(() => {
    token.set('jwt');
    authenticated.set(true);
    signOut.mockReset();
    configure();
  });

  afterEach(() => http.verify());

  describe('bearer token', () => {
    it('is added to requests whose URL starts with /api/', () => {
      client.get('/api/v1/me').subscribe();
      const req = http.expectOne('/api/v1/me');
      expect(req.request.headers.get('Authorization')).toBe('Bearer jwt');
      req.flush({});
    });

    it('follows an overridden API_BASE_URL', () => {
      configure([
        { provide: API_BASE_URL, useValue: 'https://api.example.com/v1' },
      ]);

      client.get('https://api.example.com/v1/me').subscribe();
      const apiRequest = http.expectOne('https://api.example.com/v1/me');
      expect(apiRequest.request.headers.get('Authorization')).toBe(
        'Bearer jwt',
      );
      apiRequest.flush({});

      client.get('/api/v1/me').subscribe();
      const other = http.expectOne('/api/v1/me');
      expect(other.request.headers.has('Authorization')).toBe(false);
      other.flush({});
    });

    it('is not added when there is no token', () => {
      token.set(null);
      client.get('/api/v1/health').subscribe();
      const req = http.expectOne('/api/v1/health');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });

    it.each([
      '/assets/logo.svg',
      '/apiary/x',
      'https://other.example.com/api/v1/me',
      '/v1/me',
    ])('is not added to %s', (url) => {
      client.get(url).subscribe();
      const req = http.expectOne(url);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });
  });

  describe('401 handling', () => {
    it('signs out and navigates to /login, remembering where the user was', async () => {
      await router.navigateByUrl('/trainers');

      const result = firstValueFrom(client.get('/api/v1/me')).catch(
        (e: unknown) => e,
      );
      http
        .expectOne('/api/v1/me')
        .flush({}, { status: 401, statusText: 'Unauthorized' });
      const error = await result;
      await TestBed.inject(ApplicationRef).whenStable();

      expect(signOut).toHaveBeenCalledOnce();
      expect(router.url).toBe('/login?returnUrl=%2Ftrainers');
      expect(error).toMatchObject({ status: 401 });
    });

    it('does nothing when nobody is signed in', async () => {
      authenticated.set(false);
      const result = firstValueFrom(client.get('/api/v1/me')).catch(
        (e: unknown) => e,
      );
      http
        .expectOne('/api/v1/me')
        .flush({}, { status: 401, statusText: 'Unauthorized' });
      await result;

      expect(signOut).not.toHaveBeenCalled();
    });

    it('ignores a failed dev login (wrong credentials are not an expired session)', async () => {
      const result = firstValueFrom(client.post('/api/v1/dev/login', {})).catch(
        (e: unknown) => e,
      );
      http
        .expectOne('/api/v1/dev/login')
        .flush({}, { status: 401, statusText: 'Unauthorized' });
      await result;

      expect(signOut).not.toHaveBeenCalled();
    });

    it('ignores other error statuses', async () => {
      const result = firstValueFrom(client.get('/api/v1/me')).catch(
        (e: unknown) => e,
      );
      http
        .expectOne('/api/v1/me')
        .flush({}, { status: 500, statusText: 'Server Error' });
      await result;

      expect(signOut).not.toHaveBeenCalled();
    });

    it('ignores a 401 from a URL outside /api/', async () => {
      const result = firstValueFrom(
        client.get('https://other.example.com/x'),
      ).catch((e: unknown) => e);
      http
        .expectOne('https://other.example.com/x')
        .flush({}, { status: 401, statusText: 'Unauthorized' });
      await result;

      expect(signOut).not.toHaveBeenCalled();
    });
  });
});
