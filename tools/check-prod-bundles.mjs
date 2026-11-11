// Fails when a production build of an app contains development-only authentication code.
// Run after `nx build <app>`; apps without a build in dist/ are skipped.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const APPS = ['client-web', 'trainer-web', 'admin-web'];
// The API route "dev/login" is not listed: it stays in the shared ApiClient.
const FORBIDDEN = ['DevAuth', 'dev-login'];

let checked = 0;
const problems = [];

for (const app of APPS) {
  const dir = join('dist', 'apps', app, 'browser');
  if (!existsSync(dir)) continue;
  checked += 1;
  for (const file of readdirSync(dir).filter((name) => name.endsWith('.js'))) {
    const source = readFileSync(join(dir, file), 'utf8');
    for (const needle of FORBIDDEN) {
      if (source.includes(needle)) {
        problems.push(`${app}: ${file} contains "${needle}"`);
      }
    }
  }
}

if (problems.length > 0) {
  console.error(`Development auth code leaked into production builds:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log(
  checked === 0
    ? 'No production builds found in dist/apps; nothing to check.'
    : `Production builds of ${checked} app(s) contain no development auth code.`,
);
