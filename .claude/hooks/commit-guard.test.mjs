import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./commit-guard.mjs', import.meta.url));

function guard(command) {
  const result = spawnSync('node', [script], {
    input: JSON.stringify({ tool_name: 'Bash', tool_input: { command } }),
    encoding: 'utf8',
  });
  return { status: result.status, stderr: result.stderr };
}

test('ignores commands that are not git commit', () => {
  assert.equal(guard('ls -la').status, 0);
  assert.equal(guard('git log --oneline -n 1').status, 0);
});

test('rejects a header that is not Angular style', () => {
  const result = guard('git commit -m "add stuff"');
  assert.equal(result.status, 2);
  assert.match(result.stderr, /invalid header/);
});

test('rejects an unknown type', () => {
  assert.equal(guard('git commit -m "chore(repo): tidy"').status, 2);
});

test('rejects an uppercase subject', () => {
  const result = guard('git commit -m "feat(ui): Add button"');
  assert.equal(result.status, 2);
  assert.match(result.stderr, /lowercase/);
});

test('rejects a trailing period', () => {
  const result = guard('git commit -m "feat(ui): add button."');
  assert.equal(result.status, 2);
  assert.match(result.stderr, /period/);
});

test('rejects a header longer than 100 characters', () => {
  const result = guard(`git commit -m "feat(ui): ${'a'.repeat(100)}"`);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /100/);
});

test('rejects skipping hooks', () => {
  const long = guard('git commit --no-verify -m "feat(ui): add button"');
  const short = guard('git commit -n -m "feat(ui): add button"');
  assert.equal(long.status, 2);
  assert.equal(short.status, 2);
  assert.match(long.stderr, /no-verify/);
});

test('does not mistake -n of another command for skipping hooks', () => {
  const result = guard('git log -n 1 && git commit -m "bad message"');
  assert.equal(result.status, 2);
  assert.match(result.stderr, /invalid header/);
});

test('reads the header from a heredoc', () => {
  const result = guard("git commit -F - <<'EOF'\nupdate things\n\nbody\nEOF");
  assert.equal(result.status, 2);
  assert.match(result.stderr, /invalid header "update things"/);
});

test('asks for a readable message when none is given', () => {
  const result = guard('git commit');
  assert.equal(result.status, 2);
  assert.match(result.stderr, /could not read the commit message/);
});
