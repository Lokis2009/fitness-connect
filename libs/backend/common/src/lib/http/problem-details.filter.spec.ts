import {
  ArgumentsHost,
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  PROBLEM_CONTENT_TYPE,
  ProblemDetailsFilter,
} from './problem-details.filter';

function run(exception: unknown, url = '/v1/thing') {
  const response = {
    status: jest.fn().mockReturnThis(),
    type: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({ url }),
    }),
  } as unknown as ArgumentsHost;

  new ProblemDetailsFilter().catch(exception, host);

  return {
    status: response.status.mock.calls[0]?.[0],
    contentType: response.type.mock.calls[0]?.[0],
    body: response.json.mock.calls[0]?.[0],
  };
}

describe('ProblemDetailsFilter', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('answers application/problem+json with the HTTP status', () => {
    const { status, contentType } = run(new UnauthorizedException());

    expect(status).toBe(401);
    expect(contentType).toBe(PROBLEM_CONTENT_TYPE);
    expect(PROBLEM_CONTENT_TYPE).toBe('application/problem+json');
  });

  it('maps an HttpException to type, title, status, detail and instance', () => {
    const { body } = run(
      new ForbiddenException('Role admin required'),
      '/v1/admin?x=1',
    );

    expect(body).toEqual({
      type: 'about:blank',
      title: 'Forbidden',
      status: 403,
      detail: 'Role admin required',
      instance: '/v1/admin?x=1',
    });
  });

  it('uses the standard reason phrase as the title', () => {
    expect(run(new NotFoundException()).body.title).toBe('Not Found');
    expect(
      run(new HttpException('teapot', HttpStatus.I_AM_A_TEAPOT)).body.title,
    ).toBe("I'm a Teapot");
  });

  it('joins validation messages into the detail', () => {
    const { status, body } = run(
      new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: ['email must be an email', 'password should not be empty'],
      }),
    );

    expect(status).toBe(400);
    expect(body.detail).toBe(
      'email must be an email; password should not be empty',
    );
  });

  it('turns an unknown error into a 500 without leaking its message', () => {
    const { status, body } = run(
      new Error('connection to db at 10.0.0.5 failed'),
    );

    expect(status).toBe(500);
    expect(body).toEqual({
      type: 'about:blank',
      title: 'Internal Server Error',
      status: 500,
      instance: '/v1/thing',
    });
    expect(JSON.stringify(body)).not.toContain('10.0.0.5');
  });

  it('keeps the status of a client error raised by the HTTP platform', () => {
    const tooLarge = Object.assign(new Error('request entity too large'), {
      status: 413,
      statusCode: 413,
      expose: true,
    });
    const logger = jest.spyOn(Logger.prototype, 'error');

    const { status, body } = run(tooLarge);

    expect(status).toBe(413);
    expect(body).toEqual({
      type: 'about:blank',
      title: 'Payload Too Large',
      status: 413,
      detail: 'request entity too large',
      instance: '/v1/thing',
    });
    expect(logger).not.toHaveBeenCalled();
  });

  it('does not expose the message of a platform error that is not marked safe', () => {
    const { status, body } = run(
      Object.assign(new Error('secret detail'), { status: 400 }),
    );

    expect(status).toBe(400);
    expect(body.detail).toBeUndefined();
  });

  it('treats a platform error with a server status as an unexpected 500', () => {
    const { status } = run(
      Object.assign(new Error('boom'), { status: 503, expose: false }),
    );

    expect(status).toBe(500);
  });

  it('logs unexpected errors but not client errors', () => {
    const logger = jest.spyOn(Logger.prototype, 'error');

    run(new UnauthorizedException());
    expect(logger).not.toHaveBeenCalled();

    run(new Error('boom'));
    expect(logger).toHaveBeenCalledTimes(1);
  });

  it('handles throwables that are not Error instances', () => {
    expect(run('just a string').status).toBe(500);
  });
});
