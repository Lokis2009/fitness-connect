import { Logger } from '@nestjs/common';
import { validateEnv } from '@fitness-connect/common';
import { createApp } from './app/create-app';

async function bootstrap() {
  // Fails fast with every configuration problem before anything starts.
  const env = validateEnv(process.env);
  const app = await createApp(env);
  app.enableShutdownHooks();
  await app.listen(env.API_PORT);
  // Set when Nx waits for this server to be ready
  if (process.env['NX_READY_SIGNAL_SOCKET']) {
    try {
      // Function keeps TypeScript and bundlers from rewriting or bundling the import
      const load = new Function('s', 'return import(s)') as (
        s: string,
      ) => Promise<{ emitReadySignal(server: unknown): boolean }>;
      (await load('@nx/js/ready-signal')).emitReadySignal(app.getHttpServer());
    } catch {
      // @nx/js isn't installed
    }
  }
  Logger.log(`API listening on http://localhost:${env.API_PORT}/v1`);
}

bootstrap().catch((error: unknown) => {
  Logger.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
