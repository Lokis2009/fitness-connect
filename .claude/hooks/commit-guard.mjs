import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const TYPES = ['build', 'ci', 'docs', 'feat', 'fix', 'perf', 'refactor', 'test'];
const LINT_ONLY = new Set(['test', 'docs', 'ci']);
const HEADER = new RegExp(`^(${TYPES.join('|')})(\\([a-z0-9][a-z0-9/-]*\\))?: \\S`);
const PLACEHOLDER = /\u0000H(\d+)\u0000/;

function block(message) {
  process.stderr.write(`commit-guard: ${message}\n`);
  process.exit(2);
}

function readStdin() {
  return new Promise((resolveInput) => {
    let data = '';
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolveInput(data));
  });
}

// Replace each heredoc operator with a placeholder and remove its body, so quotes and
// operators inside bodies cannot confuse the tokenizer.
function maskHeredocs(command) {
  const lines = command.split('\n');
  const out = [];
  const bodies = [];
  let nextId = 0;
  for (let i = 0; i < lines.length; i++) {
    const pending = [];
    out.push(
      lines[i].replace(/(?<!<)<<(?!<)(-?)\s*(['"]?)([A-Za-z_]\w*)\2/g, (_, dash, __, delimiter) => {
        pending.push({ dash, delimiter });
        return `\u0000H${nextId++}\u0000`;
      }),
    );
    for (const { dash, delimiter } of pending) {
      const body = [];
      i++;
      while (i < lines.length && (dash ? lines[i].trim() : lines[i]) !== delimiter) {
        body.push(lines[i]);
        i++;
      }
      bodies.push(body.join('\n'));
    }
  }
  return { masked: out.join('\n'), bodies };
}

// Split into simple commands and words, removing quotes. Operators inside quotes are kept.
function tokenize(masked) {
  const segments = [];
  let tokens = [];
  let word = null;
  const endWord = () => {
    if (word !== null) tokens.push(word);
    word = null;
  };
  const endSegment = () => {
    endWord();
    if (tokens.length) segments.push(tokens);
    tokens = [];
  };

  for (let i = 0; i < masked.length; i++) {
    const c = masked[i];
    if (c === "'") {
      const end = masked.indexOf("'", i + 1);
      const stop = end === -1 ? masked.length : end;
      word = (word ?? '') + masked.slice(i + 1, stop);
      i = stop;
    } else if (c === '"') {
      word = word ?? '';
      i++;
      while (i < masked.length && masked[i] !== '"') {
        if (masked[i] === '\\' && '"\\$`'.includes(masked[i + 1] ?? '')) i++;
        word += masked[i];
        i++;
      }
    } else if (c === '\\' && i + 1 < masked.length) {
      word = (word ?? '') + masked[i + 1];
      i++;
    } else if (c === '&' || c === '|' || c === ';' || c === '\n') {
      endSegment();
      while (masked[i + 1] === '&' || masked[i + 1] === '|') i++;
    } else if (c === ' ' || c === '\t') {
      endWord();
    } else {
      word = (word ?? '') + c;
    }
  }
  endSegment();
  return segments;
}

function commitArguments(tokens) {
  if (tokens[0] !== 'git') return null;
  let k = 1;
  while (k < tokens.length && tokens[k].startsWith('-')) {
    k += ['-C', '-c', '--git-dir', '--work-tree', '--namespace'].includes(tokens[k]) ? 2 : 1;
  }
  return tokens[k] === 'commit' ? tokens.slice(k + 1) : null;
}

function parseCommit(args) {
  const parsed = { noVerify: false, amend: false, messages: [], file: null };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--') break;
    if (arg === '--no-verify') parsed.noVerify = true;
    else if (arg === '--amend') parsed.amend = true;
    else if (arg.startsWith('--message=')) parsed.messages.push(arg.slice('--message='.length));
    else if (arg === '--message') parsed.messages.push(args[++i] ?? '');
    else if (arg.startsWith('--file=')) parsed.file = arg.slice('--file='.length);
    else if (arg === '--file') parsed.file = args[++i] ?? '';
    else if (/^-[^-]/.test(arg)) {
      const flags = arg.slice(1);
      for (let j = 0; j < flags.length; j++) {
        const flag = flags[j];
        const rest = flags.slice(j + 1);
        if (flag === 'n') parsed.noVerify = true;
        else if (flag === 'm') {
          parsed.messages.push(rest || (args[++i] ?? ''));
          break;
        } else if (flag === 'F') {
          parsed.file = rest || (args[++i] ?? '');
          break;
        } else if ('cCt'.includes(flag)) {
          if (!rest) i++;
          break;
        }
      }
    }
  }
  return parsed;
}

function resolveBody(text, bodies) {
  const match = text.match(PLACEHOLDER);
  return match ? bodies[Number(match[1])] : text;
}

function headerOf(parsed, tokens, bodies, cwd) {
  let message = null;
  if (parsed.messages.length) message = resolveBody(parsed.messages[0], bodies);
  else if (parsed.file === '-') {
    const token = tokens.find((t) => PLACEHOLDER.test(t));
    message = token ? resolveBody(token, bodies) : null;
  } else if (parsed.file) {
    try {
      message = readFileSync(resolve(cwd, parsed.file), 'utf8');
    } catch {
      message = null;
    }
  }
  if (message === null) return null;
  return message.split('\n').find((line) => line.trim()) ?? '';
}

function run(args, cwd) {
  const result = spawnSync('pnpm', ['nx', ...args], {
    cwd,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    env: { ...process.env, CI: 'true', NX_DAEMON: 'false' },
  });
  return { ok: result.status === 0, output: `${result.stdout ?? ''}${result.stderr ?? ''}` };
}

function tail(output, lines = 40) {
  return output.trim().split('\n').slice(-lines).join('\n');
}

function validateHeader(header) {
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
  return header.match(HEADER)[1];
}

const input = JSON.parse((await readStdin()) || '{}');
const command = input.tool_input?.command ?? '';
const cwd = input.cwd ?? process.cwd();

const { masked, bodies } = maskHeredocs(command);
const types = [];
for (const tokens of tokenize(masked)) {
  const args = commitArguments(tokens);
  if (args === null) continue;

  const parsed = parseCommit(args);
  if (parsed.noVerify) block('--no-verify is not allowed. Fix the underlying problem instead.');
  if (parsed.amend) block('amending a commit is not allowed. Create a new commit instead.');

  const header = headerOf(parsed, tokens, bodies, cwd);
  types.push(validateHeader(header));
  if (process.env.COMMIT_GUARD_DRY_RUN) process.stdout.write(`header: ${header}\n`);
}

if (types.length === 0 || process.env.COMMIT_GUARD_DRY_RUN) process.exit(0);

const lint = run(['affected', '--base=HEAD', '-t', 'lint'], cwd);
if (!lint.ok) block(`lint failed for affected projects.\n${tail(lint.output)}`);

if (types.some((type) => !LINT_ONLY.has(type))) {
  const tests = run(['affected', '--base=HEAD', '-t', 'test', '--coverage'], cwd);
  if (!tests.ok) {
    block(
      `tests or coverage failed for affected projects. Only "test", "docs" and "ci" commits may be red. Write the failing test as a separate "test" commit first.\n${tail(tests.output)}`,
    );
  }
}

process.exit(0);
