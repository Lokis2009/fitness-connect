import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedRequest, AuthUser } from './auth-user';
import { Roles } from './decorators';
import { RolesGuard } from './roles.guard';

class OpenController {
  handler() {
    return undefined;
  }
}

class AdminHandlerController {
  @Roles('admin')
  handler() {
    return undefined;
  }
}

@Roles('trainer', 'admin')
class StaffController {
  handler() {
    return undefined;
  }
}

function userWith(role: AuthUser['role']): AuthUser {
  return { id: 'u-1', email: `${role}@example.com`, role };
}

function contextFor(
  controller: new () => { handler(): unknown },
  user?: AuthUser,
): ExecutionContext {
  const request: AuthenticatedRequest = { headers: {}, user };
  return {
    getClass: () => controller,
    getHandler: () => controller.prototype.handler,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  it('allows any caller when no roles are required', () => {
    expect(guard.canActivate(contextFor(OpenController))).toBe(true);
    expect(
      guard.canActivate(contextFor(OpenController, userWith('client'))),
    ).toBe(true);
  });

  it('allows a caller whose role is required on the handler', () => {
    expect(
      guard.canActivate(contextFor(AdminHandlerController, userWith('admin'))),
    ).toBe(true);
  });

  it('allows any of several roles required on the controller', () => {
    expect(
      guard.canActivate(contextFor(StaffController, userWith('trainer'))),
    ).toBe(true);
    expect(
      guard.canActivate(contextFor(StaffController, userWith('admin'))),
    ).toBe(true);
  });

  it('forbids a caller with another role', () => {
    expect(() =>
      guard.canActivate(contextFor(AdminHandlerController, userWith('client'))),
    ).toThrow(ForbiddenException);
    expect(() =>
      guard.canActivate(contextFor(StaffController, userWith('client'))),
    ).toThrow(ForbiddenException);
  });

  it('forbids a route that needs a role when there is no authenticated user', () => {
    expect(() => guard.canActivate(contextFor(AdminHandlerController))).toThrow(
      ForbiddenException,
    );
  });
});
