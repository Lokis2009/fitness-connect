import { readFileSync, readdirSync } from 'node:fs';

const LIB = `${__dirname}/`;
const DIRECT_CLOCK_READ = /\bDate\.now\s*\(|new Date\(\s*\)/;

describe('the clock of the trainer home', () => {
  const sources = readdirSync(LIB).filter(
    (file) => file.endsWith('.ts') && !file.endsWith('.spec.ts') && file !== 'clock.service.ts',
  );

  it('finds the sources to scan', () => {
    expect(sources).toEqual(expect.arrayContaining(['trainer-home.ts', 'requests-store.ts', 'sessions-store.ts']));
  });

  it.each(sources)('%s takes now from ClockService and never reads the device clock', (file) => {
    expect(readFileSync(`${LIB}${file}`, 'utf8')).not.toMatch(DIRECT_CLOCK_READ);
  });
});
