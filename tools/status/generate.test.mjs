import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import {
  collectDocs,
  collectOpenQuestions,
  collectProjects,
  generate,
  loadStatus,
  main,
} from './generate.mjs';

const VALID_STATUS = `
focus: Finish the scheduled-session journey.
workstreams:
  - id: phase-1
    name: Phase 1 foundation
    state: done
    summary: Apps, API, database and login are in place.
    links: [docs/plans/phase-1.md]
  - id: availability
    name: Trainer availability
    state: in-progress
    owner: trainer team
    summary: Trainers publish weekly availability.
    next: Draft the availability contract
  - id: cognito
    name: Cognito login
    state: blocked
    summary: Replace dev auth with hosted login.
    blockedBy: waiting on the AWS account
`;

const ARCHITECTURE = `# Architecture

## 10. Open questions

| # | Question | Blocks | Default if unanswered |
|---|----------|--------|-----------------------|
| 1 | Platform payment model | Payouts | Pay in person |
| 2 | ~~Identity provider~~ | | Resolved: Cognito |
| 4 | Maps provider | Service area, geo search | Text plus coordinates |
| 6 | IaC tool \\| CI | First deployment | Local only |

## 11. Next steps
`;

function makeRepo(files = {}) {
  const root = mkdtempSync(join(tmpdir(), 'status-'));
  const all = {
    'status/status.yaml': VALID_STATUS,
    'docs/plans/phase-1.md':
      '# Phase 1 plan\n\nStatus: done\nUpdated: 2026-11-10\n',
    'docs/prd/sessions.md':
      '# PRD: sessions\n\nStatus: draft for review.\nUpdated: 2026-11-15\n',
    'docs/decisions/first-release.md':
      '# First-release decisions\n\nUpdated: 2026-11-15\n',
    'Architecture.md': ARCHITECTURE,
    'apps/web/project.json': JSON.stringify({
      name: 'web',
      projectType: 'application',
      tags: ['scope:client', 'type:app'],
    }),
    'libs/frontend/ui/project.json': JSON.stringify({
      name: 'ui',
      projectType: 'library',
      tags: ['scope:shared', 'type:ui'],
    }),
    ...files,
  };
  for (const [path, content] of Object.entries(all)) {
    if (content === null) continue;
    const full = join(root, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  return root;
}

test('loadStatus parses workstreams and the focus line', () => {
  const status = loadStatus(makeRepo());
  assert.equal(status.focus, 'Finish the scheduled-session journey.');
  assert.deepEqual(
    status.workstreams.map((w) => [w.id, w.state]),
    [
      ['phase-1', 'done'],
      ['availability', 'in-progress'],
      ['cognito', 'blocked'],
    ],
  );
});

test('loadStatus rejects a missing status file', () => {
  const root = makeRepo({ 'status/status.yaml': null });
  assert.throws(() => loadStatus(root), /status\/status\.yaml/);
});

test('loadStatus rejects an unknown state', () => {
  const root = makeRepo({
    'status/status.yaml':
      'focus: x\nworkstreams:\n  - {id: a, name: A, state: nearly, summary: s}\n',
  });
  assert.throws(() => loadStatus(root), /state/);
});

test('loadStatus rejects a workstream without a summary', () => {
  const root = makeRepo({
    'status/status.yaml':
      'focus: x\nworkstreams:\n  - {id: a, name: A, state: done}\n',
  });
  assert.throws(() => loadStatus(root), /summary/);
});

test('loadStatus rejects duplicate ids', () => {
  const root = makeRepo({
    'status/status.yaml':
      'focus: x\nworkstreams:\n  - {id: a, name: A, state: done, summary: s}\n  - {id: a, name: B, state: done, summary: s}\n',
  });
  assert.throws(() => loadStatus(root), /duplicate/i);
});

test('loadStatus requires blockedBy on a blocked workstream', () => {
  const root = makeRepo({
    'status/status.yaml':
      'focus: x\nworkstreams:\n  - {id: a, name: A, state: blocked, summary: s}\n',
  });
  assert.throws(() => loadStatus(root), /blockedBy/);
});

test('loadStatus rejects a link to a file that does not exist', () => {
  const root = makeRepo({
    'status/status.yaml':
      'focus: x\nworkstreams:\n  - {id: a, name: A, state: done, summary: s, links: [docs/missing.md]}\n',
  });
  assert.throws(() => loadStatus(root), /docs\/missing\.md/);
});

test('loadStatus accepts a link with an anchor', () => {
  const root = makeRepo({
    'status/status.yaml':
      'focus: x\nworkstreams:\n  - {id: a, name: A, state: done, summary: s, links: ["docs/plans/phase-1.md#phase-1-plan"]}\n',
  });
  assert.equal(
    loadStatus(root).workstreams[0].links[0],
    'docs/plans/phase-1.md#phase-1-plan',
  );
});

const linkTo = (target) => ({
  'status/status.yaml': `focus: x\nworkstreams:\n  - {id: a, name: A, state: done, summary: s, links: ["${target}"]}\n`,
});

test('loadStatus rejects an anchor that matches no heading', () => {
  const root = makeRepo(linkTo('docs/plans/phase-1.md#nope'));
  assert.throws(() => loadStatus(root), /#nope/);
});

test('loadStatus resolves anchors of repeated headings with a numeric suffix', () => {
  const root = makeRepo({
    'docs/plans/phase-1.md': '# Plan\n\n## Notes\n\n## Notes\n',
    ...linkTo('docs/plans/phase-1.md#notes-1'),
  });
  assert.equal(loadStatus(root).workstreams.length, 1);
});

test('loadStatus does not check anchors on files that are not Markdown', () => {
  const root = makeRepo({
    'styles/tokens.css': ':root {}\n',
    ...linkTo('styles/tokens.css#anything'),
  });
  assert.equal(loadStatus(root).workstreams.length, 1);
});

test('loadStatus rejects links that are not a list', () => {
  const root = makeRepo({
    'status/status.yaml':
      'focus: x\nworkstreams:\n  - {id: a, name: A, state: done, summary: s, links: docs/plans/phase-1.md}\n',
  });
  assert.throws(() => loadStatus(root), /links must be a list/);
});

test('collectProjects lists every project.json under apps and libs, sorted by path', () => {
  assert.deepEqual(collectProjects(makeRepo()), [
    {
      name: 'web',
      path: 'apps/web',
      type: 'application',
      tags: ['scope:client', 'type:app'],
    },
    {
      name: 'ui',
      path: 'libs/frontend/ui',
      type: 'library',
      tags: ['scope:shared', 'type:ui'],
    },
  ]);
});

test('collectProjects sorts by plain character order, not locale order', () => {
  const root = makeRepo({
    'apps/Zeta/project.json': JSON.stringify({ name: 'Zeta' }),
    'apps/alpha/project.json': JSON.stringify({ name: 'alpha' }),
  });
  assert.deepEqual(
    collectProjects(root).map((p) => p.path),
    ['apps/Zeta', 'apps/alpha', 'apps/web', 'libs/frontend/ui'],
  );
});

test('collectDocs keeps only the first sentence of a status, without its period', () => {
  const root = makeRepo({
    'docs/plans/other.md': '# Other\n\nStatus: draft. More detail follows.\n',
    'docs/plans/third.md': '# Third\n\nStatus: done.\n',
  });
  assert.deepEqual(
    collectDocs(root).plans.map((d) => d.status),
    ['draft', 'done', 'done'],
  );
});

test('collectDocs reads title, status and updated date, leaving a missing status undefined', () => {
  const docs = collectDocs(makeRepo());
  assert.deepEqual(docs.plans, [
    {
      title: 'Phase 1 plan',
      path: 'docs/plans/phase-1.md',
      status: 'done',
      updated: '2026-11-10',
    },
  ]);
  assert.equal(docs.prd[0].status, 'draft for review');
  assert.equal(docs.decisions[0].status, undefined);
  assert.equal(docs.decisions[0].updated, '2026-11-15');
});

test('collectOpenQuestions skips resolved rows and keeps escaped pipes', () => {
  assert.deepEqual(collectOpenQuestions(makeRepo()), [
    { id: '1', question: 'Platform payment model', blocks: 'Payouts' },
    { id: '4', question: 'Maps provider', blocks: 'Service area, geo search' },
    { id: '6', question: 'IaC tool | CI', blocks: 'First deployment' },
  ]);
});

const withRows = (rows) => ({
  'Architecture.md': `# Architecture\n\n## 3. Open questions\n\n| # | Question | Blocks | Default |\n|:---|:---:|---|---:|\n${rows}\n\n## 4. Next\n`,
});

test('collectOpenQuestions ignores an aligned separator row', () => {
  const root = makeRepo(withRows('| 1 | Payments | Payouts | Later |'));
  assert.deepEqual(collectOpenQuestions(root), [
    { id: '1', question: 'Payments', blocks: 'Payouts' },
  ]);
});

test('collectOpenQuestions names a malformed row instead of throwing a TypeError', () => {
  const root = makeRepo(withRows('| 14 |'));
  assert.throws(() => collectOpenQuestions(root), /malformed.*\| 14 \|/i);
});

test('collectOpenQuestions fails when Architecture.md has no open questions section', () => {
  const root = makeRepo({ 'Architecture.md': '# Architecture\n' });
  assert.throws(() => collectOpenQuestions(root), /Open questions/);
});

test('render produces the expected sections', () => {
  const root = makeRepo();
  const out = generate(root);
  assert.match(out, /^<!-- Generated by `pnpm status:generate`/);
  assert.match(out, /# Project status/);
  assert.match(out, /\*\*Focus:\*\* Finish the scheduled-session journey\./);
  assert.match(out, /\| Phase 1 foundation \| done \|/);
  assert.match(out, /\[phase-1\]\(docs\/plans\/phase-1\.md\)/);
  assert.match(
    out,
    /\| Trainer availability \| in-progress \| trainer team \| Draft the availability contract \|/,
  );
  assert.match(out, /Blocked: waiting on the AWS account/);
  assert.doesNotMatch(out, /section \d/);
  assert.match(out, /## Open questions/);
  assert.match(out, /\| 4 \| Maps provider \| Service area, geo search \|/);
  assert.match(out, /IaC tool \\\| CI/);
  assert.doesNotMatch(out, /Identity provider/);
  assert.match(
    out,
    /\[PRD: sessions\]\(docs\/prd\/sessions\.md\) \| draft for review \| 2026-11-15 \|/,
  );
  assert.match(
    out,
    /\| web \| application \| scope:client, type:app \| `apps\/web` \|/,
  );
});

test('render keeps next on a blocked workstream next to the blocker', () => {
  const root = makeRepo({
    'status/status.yaml':
      'focus: x\nworkstreams:\n  - {id: a, name: A, state: blocked, summary: s, blockedBy: waiting on AWS, next: Request the account}\n',
  });
  assert.match(
    generate(root),
    /Blocked: waiting on AWS\. Next: Request the account/,
  );
});

test('render shows a dash for a missing doc status', () => {
  assert.match(
    generate(makeRepo()),
    /\[First-release decisions\]\(docs\/decisions\/first-release\.md\) \| - \| 2026-11-15 \|/,
  );
});

test('render is deterministic', () => {
  const root = makeRepo();
  assert.equal(generate(root), generate(root));
});

test('main writes STATUS.md', () => {
  const root = makeRepo();
  assert.equal(main([], root), 0);
  assert.equal(readFileSync(join(root, 'STATUS.md'), 'utf8'), generate(root));
});

test('main --check passes when STATUS.md is current', () => {
  const root = makeRepo();
  main([], root);
  assert.equal(main(['--check'], root), 0);
});

test('main --check fails when STATUS.md is stale and leaves it untouched', () => {
  const root = makeRepo();
  main([], root);
  writeFileSync(join(root, 'STATUS.md'), 'old');
  assert.equal(main(['--check'], root), 1);
  assert.equal(readFileSync(join(root, 'STATUS.md'), 'utf8'), 'old');
});

test('main --check fails when STATUS.md does not exist', () => {
  const root = makeRepo();
  assert.equal(main(['--check'], root), 1);
  assert.equal(existsSync(join(root, 'STATUS.md')), false);
});

test('main --check fails when a project is added without regenerating', () => {
  const root = makeRepo();
  main([], root);
  mkdirSync(join(root, 'apps/new'), { recursive: true });
  writeFileSync(
    join(root, 'apps/new/project.json'),
    JSON.stringify({ name: 'new', projectType: 'application', tags: [] }),
  );
  assert.equal(main(['--check'], root), 1);
});

test('main reports invalid status with a non-zero code', () => {
  const root = makeRepo({
    'status/status.yaml': 'focus: x\nworkstreams: nope\n',
  });
  assert.equal(main([], root), 1);
});
