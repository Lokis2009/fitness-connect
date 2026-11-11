import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/** Global guard: enforces `@Roles()` against the user set by the JWT guard. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    void this.reflector;
    void context;
    throw new Error('not implemented');
  }
}
