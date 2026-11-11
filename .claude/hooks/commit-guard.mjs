import { spawnSync } from 'node:child_process';

const TYPES = ['build', 'ci', 'docs', 'feat', 'fix', 'perf', 'refactor', 'test'];
const LINT_ONLY = new Set(['test', 'docs', 'ci']);
const HEADER = new RegExp(`^(${TYPES.join('|')})(\\([a-z0-9][a-z0-9/-]*\\))?: \\S`);

function block(message) {
  process.stderr.write(`commit-guard: ${message}\n`);
  process.exit(2);
}

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data));
  });
}

function extractHeader(command) {
  const heredoc = command.match(/<<-?\s*['"]?(\w+)['"]?\n([\s\S]*?)\n\s*\1\b/);
  if (heredoc) return heredoc[2].split('\n').find((line) => line.trim()) ?? '';

  const inline = command.match(/(?:-m|--message)[ =]+(?:"((?:[^"\\]|\\.)*)"|'([^']*)')/);
  if (inline) return (inline[1] ?? inline[2]).split('\n')[0];

  return null;
}

function run(args, cwd) {
  const result = spawnSync('pnpm', ['nx', ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, CI: 'true', NX_DAEMON: 'false' },
  });
  return { ok: result.status === 0, output: `${result.stdout ?? ''}${result.stderr ?? ''}` };
}

function tail(output, lines = 40) {
  return output.trim().split('\n').slice(-lines).join('\n');
}

const input = JSON.parse((await readStdin()) || '{}');
const command = input.tool_input?.command ?? '';

if (!/\bgit\s+(?:-\S+\s+)*commit\b/.test(command)) process.exit(0);

const commitInvocation = command.match(/\bgit\s+(?:-\S+\s+)*commit\b[^&;|\n]*/)?.[0] ?? '';
if (/--no-verify|\s-n(?:\s|$)/.test(commitInvocation)) {
  block('--no-verify is not allowed. Fix the underlying problem instead.');
}

const header = extractHeader(command);
if (header === null) {
  block('could not read the commit message. Pass it with -m "..." or a heredoc (-F - <<\'EOF\').');
}
if (!HEADER.test(header)) {
  block(
    `invalid header "${header}". Use Angular style: <type>(<scope>): <subject>, with type one of ${TYPES.join(', ')}.`,
  );
}
if (header.length > 100) block(`header is ${header.length} characters; the limit is 100.`);
if (header.endsWith('.')) block('header must not end with a period.');
const subject = header.slice(header.indexOf(': ') + 2);
if (/^[A-Z]/.test(subject)) block('subject must start with a lowercase letter (imperative mood).');

const type = header.match(HEADER)[1];
const cwd = input.cwd ?? process.cwd();

const lint = run(['affected', '--base=HEAD', '-t', 'lint'], cwd);
if (!lint.ok) block(`lint failed for affected projects.\n${tail(lint.output)}`);

if (!LINT_ONLY.has(type)) {
  const tests = run(['affected', '--base=HEAD', '-t', 'test', '--coverage'], cwd);
  if (!tests.ok) {
    block(
      `tests or coverage failed for affected projects. A "${type}" commit must be green. Write the failing test as a separate "test" commit first.\n${tail(tests.output)}`,
    );
  }
}

process.exit(0);
