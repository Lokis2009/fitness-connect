import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL, ApiClient } from './api-client';
import { ApiError } from './api-error';
import type { DevLoginResponse, Problem, User } from './api-types';

const user: User = {
  id: '6f1c1d4e-7a52-4a39-9d52-1f3c2f6f5a10',
  email: 'trainer@example.com',
  displayName: 'Tara Trainer',
  role: 'trainer',
};

const unauthorized: Problem = {
  type: 'about:blank',
  title: 'Unauthorized',
  status: 401,
};

describe('ApiClient', () => {
  let api: ApiClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ApiClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('defaults the base URL to /api/v1', () => {
    expect(TestBed.inject(API_BASE_URL)).toBe('/api/v1');
  });

  it('getHealth calls GET /api/v1/health', async () => {
    const result = firstValueFrom(api.getHealth());
    const req = http.expectOne('/api/v1/health');
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'ok' });
    expect(await result).toEqual({ status: 'ok' });
  });

  it('getMe calls GET /api/v1/me', async () => {
    const result = firstValueFrom(api.getMe());
    const req = http.expectOne('/api/v1/me');
    expect(req.request.method).toBe('GET');
    req.flush(user);
    expect(await result).toEqual(user);
  });

  it('devLogin calls POST /api/v1/dev/login with the body', async () => {
    const response: DevLoginResponse = { accessToken: 'jwt', user };
    const body = { email: user.email, password: 'secret' };

    const result = firstValueFrom(api.devLogin(body));
    const req = http.expectOne('/api/v1/dev/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(response);
    expect(await result).toEqual(response);
  });

  it('maps a 401 problem response to an ApiError', async () => {
    const result = firstValueFrom(api.getMe());
    http
      .expectOne('/api/v1/me')
      .flush(unauthorized, { status: 401, statusText: 'Unauthorized' });

    const error = await result.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(401);
    expect((error as ApiError).problem).toEqual(unauthorized);
  });

  it('maps a network failure to an ApiError with status 0', async () => {
    const result = firstValueFrom(api.getHealth());
    http.expectOne('/api/v1/health').error(new ProgressEvent('error'));

    const error = await result.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(0);
  });

  it('uses a custom base URL when provided', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'https://api.example.com/v1' },
      ],
    });
    const custom = TestBed.inject(ApiClient);
    const controller = TestBed.inject(HttpTestingController);

    const result = firstValueFrom(custom.getHealth());
    controller.expectOne('https://api.example.com/v1/health').flush({ status: 'ok' });
    await result;
    controller.verify();
  });
});
