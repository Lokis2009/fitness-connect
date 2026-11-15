#!/usr/bin/env node
// Renders STATUS.md from status/status.yaml plus facts read from the repo.
// `--check` fails when the committed STATUS.md differs from the rendered output.

export const STATES = ['done', 'in-progress', 'planned', 'blocked', 'deferred'];

export function loadStatus(root) {
  throw new Error('not implemented');
}

export function collectProjects(root) {
  throw new Error('not implemented');
}

export function collectDocs(root) {
  throw new Error('not implemented');
}

export function collectOpenQuestions(root) {
  throw new Error('not implemented');
}

export function render(model) {
  throw new Error('not implemented');
}

export function generate(root) {
  throw new Error('not implemented');
}

export function main(argv, root) {
  throw new Error('not implemented');
}
