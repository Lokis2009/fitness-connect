import {
  Body,
  Controller,
  Get,
  INestApplication,
  Logger,
  Post,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { IsEmail } from 'class-validator';
import { configureApp } from './configure-app';

class CreateThingDto {
  @IsEmail()
  email!: string;
}

@Controller('things')
class ThingsController {
  @Get()
  list() {
    return { things: [] };
  }

  @Get('boom')
  boom() {
    throw new Error('database password is hunter2');
  }

  @Post()
  create(@Body() body: CreateThingDto) {
    return { email: body.email };
  }
}

const ALLOWED_ORIGIN = 'http://localhost:4200';

describe('configureApp', () => {
  let app: INestApplication;
  let url: string;

  beforeAll(async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const moduleRef = await Test.createTestingModule({
      controllers: [ThingsController],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app, { CORS_ORIGINS: [ALLOWED_ORIGIN] });
    await app.listen(0, '127.0.0.1');
    url = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
    jest.restoreAllMocks();
  });

  it('serves routes under the v1 prefix only', async () => {
    expect((await fetch(`${url}/v1/things`)).status).toBe(200);
    expect((await fetch(`${url}/things`)).status).toBe(404);
  });

  it('answers unknown routes with problem details', async () => {
    const response = await fetch(`${url}/v1/nope`);

    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).toContain(
      'application/problem+json',
    );
    expect(await response.json()).toMatchObject({
      title: 'Not Found',
      status: 404,
      instance: '/v1/nope',
    });
  });

  it('rejects an invalid body with a 400 problem naming the field', async () => {
    const response = await fetch(`${url}/v1/things`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' }),
    });

    expect(response.status).toBe(400);
    expect(response.headers.get('content-type')).toContain(
      'application/problem+json',
    );
    const problem = await response.json();
    expect(problem.title).toBe('Bad Request');
    expect(problem.detail).toContain('email');
  });

  it('rejects properties that are not part of the DTO', async () => {
    const response = await fetch(`${url}/v1/things`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'a@example.com', role: 'admin' }),
    });

    expect(response.status).toBe(400);
    expect((await response.json()).detail).toContain('role');
  });

  it('accepts a valid body', async () => {
    const response = await fetch(`${url}/v1/things`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'a@example.com' }),
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ email: 'a@example.com' });
  });

  it('hides the cause of an unexpected error', async () => {
    const response = await fetch(`${url}/v1/things/boom`);

    expect(response.status).toBe(500);
    const text = await response.text();
    expect(text).not.toContain('hunter2');
    expect(JSON.parse(text)).toMatchObject({
      title: 'Internal Server Error',
      status: 500,
    });
  });

  it('allows CORS for an origin on the allow-list', async () => {
    const response = await fetch(`${url}/v1/things`, {
      headers: { origin: ALLOWED_ORIGIN },
    });

    expect(response.headers.get('access-control-allow-origin')).toBe(
      ALLOWED_ORIGIN,
    );
  });

  it('does not allow CORS for other origins', async () => {
    const response = await fetch(`${url}/v1/things`, {
      headers: { origin: 'http://evil.example' },
    });

    expect(response.headers.get('access-control-allow-origin')).toBeNull();
  });
});
