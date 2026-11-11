import { Test } from '@nestjs/testing';
import { APP_ENV, AppConfigModule } from './app-config.module';
import type { Env } from './env';

describe('AppConfigModule', () => {
  it('provides the validated environment under APP_ENV', async () => {
    const env: Env = {
      NODE_ENV: 'test',
      API_PORT: 3000,
      CORS_ORIGINS: [],
      DATABASE_URL: 'postgres://localhost/db',
      JWT_DEV_SECRET: 'secret-for-tests',
    };

    const moduleRef = await Test.createTestingModule({
      imports: [AppConfigModule.forRoot(env)],
    }).compile();

    expect(moduleRef.get(APP_ENV)).toBe(env);
  });
});
