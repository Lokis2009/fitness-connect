import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedRequest, AuthUser } from './auth-user';
import { Public } from './decorators';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { TokenVerifier } from './token-verifier';

class ProtectedController {
  handler() {
    return undefined;
  }
}

@Public()
class PublicController {
  handler() {
    return undefined;
  }
}

class PublicHandlerController {
  @Public()
  handler() {
    return undefined;
  }
}

const caller: AuthUser = {
  id: '6f3d9a0e-1b0f-4a43-9d8a-2f5a3e0d9c11',
  email: 'client@example.com',
  role: 'client',
};

function contextFor(
  controller: new () => { handler(): unknown },
  request: AuthenticatedRequest,
): ExecutionContext {
  return {
    getClass: () => controller,
    getHandler: () => controller.prototype.handler,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function requestWith(authorization?: string): AuthenticatedRequest {
  return { headers: authorization ? { authorization } : {} };
}

describe('JwtAuthGuard', () => {
  let verifier: jest.Mocked<TokenVerifier>;
  let guard: JwtAuthGuard;

  beforeEach(() => {
    verifier = { verify: jest.fn().mockResolvedValue(caller) };
    guard = new JwtAuthGuard(new Reflector(), verifier);
  });

  it.each([
    ['a public controller', PublicController],
    ['a public handler', PublicHandlerController],
  ])('lets %s through without a token', async (_name, controller) => {
    await expect(
      guard.canActivate(contextFor(controller, requestWith())),
    ).resolves.toBe(true);
    expect(verifier.verify).not.toHaveBeenCalled();
  });

  it('rejects a request without an Authorization header', async () => {
    await expect(
      guard.canActivate(contextFor(ProtectedController, requestWith())),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(verifier.verify).not.toHaveBeenCalled();
  });

  it.each([
    ['a non bearer scheme', 'Basic dXNlcjpwYXNz'],
    ['a bearer scheme without a token', 'Bearer '],
    ['a bare token', 'abc.def.ghi'],
  ])('rejects %s', async (_name, header) => {
    await expect(
      guard.canActivate(contextFor(ProtectedController, requestWith(header))),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(verifier.verify).not.toHaveBeenCalled();
  });

  it('rejects when the verifier rejects the token, without leaking why', async () => {
    verifier.verify.mockRejectedValue(
      new Error('signature verification failed'),
    );

    const result = guard.canActivate(
      contextFor(ProtectedController, requestWith('Bearer bad.token.value')),
    );

    await expect(result).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(result).rejects.not.toThrow('signature');
  });

  it('attaches the verified user to the request', async () => {
    const request = requestWith('Bearer good.token.value');

    await expect(
      guard.canActivate(contextFor(ProtectedController, request)),
    ).resolves.toBe(true);

    expect(verifier.verify).toHaveBeenCalledWith('good.token.value');
    expect(request.user).toEqual(caller);
  });

  it('accepts the bearer scheme in any letter case', async () => {
    await expect(
      guard.canActivate(
        contextFor(ProtectedController, requestWith('bearer good.token.value')),
      ),
    ).resolves.toBe(true);
  });

  it('rejects every protected request when no verifier is registered', async () => {
    const withoutVerifier = new JwtAuthGuard(new Reflector());

    await expect(
      withoutVerifier.canActivate(
        contextFor(ProtectedController, requestWith('Bearer good.token.value')),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
