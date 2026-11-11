import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TOKEN_VERIFIER, type TokenVerifier } from './token-verifier';

/**
 * Global guard: requires a valid bearer token on every route that is not
 * marked `@Public()`. Without a registered verifier every protected route
 * answers 401, which is the production state until Cognito is wired in.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Optional()
    @Inject(TOKEN_VERIFIER)
    private readonly verifier?: TokenVerifier,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    void this.reflector;
    void this.verifier;
    void context;
    throw new Error('not implemented');
  }
}
