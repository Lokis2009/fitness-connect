import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./commit-guard.mjs', import.meta.url));

function guard(command, { dryRun = false } = {}) {
  const result = spawnSync('node', [script], {
    input: JSON.stringify({ tool_name: 'Bash', tool_input: { command } }),
    encoding: 'utf8',
    env: { ...process.env, COMMIT_GUARD_DRY_RUN: dryRun ? '1' : '' },
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
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

test('reads the header from -am', () => {
  const result = guard('git commit -am "feat(ui): add button"', { dryRun: true });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /header: feat\(ui\): add button/);
});

test('reads the header from -m with the message attached', () => {
  const result = guard('git commit -m"fix(ui): handle focus"', { dryRun: true });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /header: fix\(ui\): handle focus/);
});

test('reads the header from --message=', () => {
  const result = guard('git commit --message="fix(ui): handle focus"', { dryRun: true });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /header: fix\(ui\): handle focus/);
});

test('uses the first of several -m options', () => {
  const result = guard('git commit -m "feat(ui): add x" -m "body text"', { dryRun: true });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /header: feat\(ui\): add x/);
});

test('reads the header from a command substitution heredoc', () => {
  const result = guard(
    'git commit -m "$(cat <<\'EOF\'\nfeat(ui): add button\n\nbody\nEOF\n)"',
    { dryRun: true },
  );
  assert.equal(result.status, 0);
  assert.match(result.stdout, /header: feat\(ui\): add button/);
});

test('finds the commit after other commands', () => {
  const result = guard('git add a.txt && git commit -m "feat(ui): add x"', { dryRun: true });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /header: feat\(ui\): add x/);
});

test('detects a commit that uses git -C', () => {
  const result = guard('git -C apps commit -m "bad message"');
  assert.equal(result.status, 2);
  assert.match(result.stderr, /invalid header/);
});

test('rejects --no-verify even after a semicolon inside the message', () => {
  const result = guard('git commit -m "feat(ui): add a; b" --no-verify');
  assert.equal(result.status, 2);
  assert.match(result.stderr, /no-verify/);
});

test('rejects clustered short flags that skip hooks', () => {
  for (const command of ['git commit -nm "feat(ui): add x"', 'git commit -anm "feat(ui): add x"']) {
    const result = guard(command);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /no-verify/);
  }
});

test('does not treat the n inside a message as a flag', () => {
  const result = guard('git commit -m "feat(ui): add -n option"', { dryRun: true });
  assert.equal(result.status, 0);
});

test('validates the commit message, not an unrelated heredoc', () => {
  const result = guard("cat <<'EOF' > notes.txt\nfeat(ui): fine\nEOF\ngit commit -m \"bad msg\"");
  assert.equal(result.status, 2);
  assert.match(result.stderr, /invalid header "bad msg"/);
});

test('ignores text that only mentions git commit', () => {
  assert.equal(guard('echo "git commit -m bad"').status, 0);
  assert.equal(guard("git log --grep='git commit'").status, 0);
});

test('rejects amending a commit', () => {
  const result = guard('git commit --amend -m "feat(ui): add x"');
  assert.equal(result.status, 2);
  assert.match(result.stderr, /amend/);
});
