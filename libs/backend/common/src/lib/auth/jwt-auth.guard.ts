import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedRequest } from './auth-user';
import { IS_PUBLIC_KEY } from './decorators';
import { TOKEN_VERIFIER, type TokenVerifier } from './token-verifier';

const BEARER = /^Bearer\s+(\S+)$/i;

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
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerToken(request.headers['authorization']);
    if (!token || !this.verifier) {
      throw new UnauthorizedException();
    }

    try {
      request.user = await this.verifier.verify(token);
    } catch {
      // Never reveal why a token was refused.
      throw new UnauthorizedException();
    }
    return true;
  }
}

function extractBearerToken(
  header: string | string[] | undefined,
): string | undefined {
  if (typeof header !== 'string') return undefined;
  return BEARER.exec(header)?.[1];
}
