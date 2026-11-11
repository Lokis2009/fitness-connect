import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { Schema } from './json-schema';

const WORKSPACE_ROOT = resolve(__dirname, '../../../..');
const OPENAPI_FILE = join(
  WORKSPACE_ROOT,
  'libs/shared/api-contract/openapi/openapi.yaml',
);

interface MediaType {
  schema?: Schema;
}
interface ResponseObject {
  content?: Record<string, MediaType>;
}
interface Operation {
  responses: Record<string, ResponseObject>;
  requestBody?: { content: Record<string, MediaType> };
}
interface OpenApiDocument {
  paths: Record<string, Record<string, Operation>>;
}

let cached: OpenApiDocument | undefined;

/**
 * The contract as one JSON document with all $refs resolved, produced by the
 * Redocly CLI that the workspace already uses to lint it.
 */
export function loadContract(): OpenApiDocument {
  if (!cached) {
    const dir = mkdtempSync(join(tmpdir(), 'fc-contract-'));
    const out = join(dir, 'openapi.json');
    try {
      execFileSync(
        join(WORKSPACE_ROOT, 'node_modules/.bin/redocly'),
        ['bundle', OPENAPI_FILE, '--ext', 'json', '--dereferenced', '-o', out],
        { stdio: 'pipe' },
      );
      cached = JSON.parse(readFileSync(out, 'utf8')) as OpenApiDocument;
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
  return cached;
}

function operation(method: string, path: string): Operation {
  const found = loadContract().paths[path]?.[method.toLowerCase()];
  if (!found) throw new Error(`${method} ${path} is not in the contract`);
  return found;
}

/** Status codes the contract documents for an operation. */
export function documentedStatuses(method: string, path: string): string[] {
  return Object.keys(operation(method, path).responses);
}

/** The schema of the response body for a status and media type, or undefined. */
export function responseSchema(
  method: string,
  path: string,
  status: number,
  mediaType: string,
): Schema | undefined {
  const response = operation(method, path).responses[String(status)];
  if (!response)
    throw new Error(`${method} ${path} documents no ${status} response`);
  return response.content?.[mediaType]?.schema;
}

/** The schema of the JSON request body of an operation. */
export function requestSchema(method: string, path: string): Schema {
  const schema = operation(method, path).requestBody?.content[
    'application/json'
  ]?.schema;
  if (!schema)
    throw new Error(`${method} ${path} documents no JSON request body`);
  return schema;
}
