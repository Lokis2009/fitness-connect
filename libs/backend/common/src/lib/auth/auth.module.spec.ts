import {
  Controller,
  Get,
  Global,
  INestApplication,
  Module,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { AuthUser } from './auth-user';
import { AuthModule } from './auth.module';
import { CurrentUser, Public, Roles } from './decorators';
import { TOKEN_VERIFIER, type TokenVerifier } from './token-verifier';

const users: Record<string, AuthUser> = {
  'client-token': { id: 'u-1', email: 'client@example.com', role: 'client' },
  'admin-token': { id: 'u-2', email: 'admin@example.com', role: 'admin' },
};

const verifier: TokenVerifier = {
  async verify(token) {
    const user = users[token];
    if (!user) throw new Error('invalid token');
    return user;
  },
};

@Controller('probe')
class ProbeController {
  @Public()
  @Get('open')
  open() {
    return { open: true };
  }

  @Get('who')
  who(@CurrentUser() user: AuthUser) {
    return user;
  }

  @Roles('admin')
  @Get('admin')
  admin(@CurrentUser() user: AuthUser) {
    return { admin: user.email };
  }
}

/** Global, like the real DevAuthModule, so the guard in AuthModule can see it. */
@Global()
@Module({
  providers: [{ provide: TOKEN_VERIFIER, useValue: verifier }],
  exports: [TOKEN_VERIFIER],
})
class VerifierModule {}

@Module({
  imports: [AuthModule, VerifierModule],
  controllers: [ProbeController],
})
class WithVerifierModule {}

@Module({ imports: [AuthModule], controllers: [ProbeController] })
class WithoutVerifierModule {}

async function start(module: new () => unknown) {
  const moduleRef = await Test.createTestingModule({
    imports: [module],
  }).compile();
  const app = moduleRef.createNestApplication();
  await app.listen(0, '127.0.0.1');
  return { app, url: await app.getUrl() };
}

function get(url: string, path: string, token?: string) {
  return fetch(`${url}${path}`, {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

describe('AuthModule', () => {
  describe('with a token verifier', () => {
    let app: INestApplication;
    let url: string;

    beforeAll(async () => {
      ({ app, url } = await start(WithVerifierModule));
    });

    afterAll(async () => {
      await app.close();
    });

    it('leaves public routes open', async () => {
      const response = await get(url, '/probe/open');

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ open: true });
    });

    it('answers 401 on a protected route without a token', async () => {
      expect((await get(url, '/probe/who')).status).toBe(401);
    });

    it('answers 401 on a token the verifier rejects', async () => {
      expect((await get(url, '/probe/who', 'forged')).status).toBe(401);
    });

    it('injects the verified user with @CurrentUser()', async () => {
      const response = await get(url, '/probe/who', 'client-token');

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(users['client-token']);
    });

    it('answers 403 when the role is not allowed', async () => {
      expect((await get(url, '/probe/admin', 'client-token')).status).toBe(403);
    });

    it('lets an allowed role through', async () => {
      const response = await get(url, '/probe/admin', 'admin-token');

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ admin: 'admin@example.com' });
    });
  });

  describe('without a token verifier (production until Cognito)', () => {
    let app: INestApplication;
    let url: string;

    beforeAll(async () => {
      ({ app, url } = await start(WithoutVerifierModule));
    });

    afterAll(async () => {
      await app.close();
    });

    it('keeps public routes open and rejects every token', async () => {
      expect((await get(url, '/probe/open')).status).toBe(200);
      expect((await get(url, '/probe/who', 'client-token')).status).toBe(401);
    });
  });
});
