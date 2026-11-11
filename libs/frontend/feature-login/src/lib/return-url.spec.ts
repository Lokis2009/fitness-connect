import { resolveReturnUrl } from './return-url';

describe('resolveReturnUrl', () => {
  const fallback = '/home';

  it.each(['/ok', '/', '/trainers?page=2', '/a/b#section'])(
    'accepts the in-app path %s',
    (url) => {
      expect(resolveReturnUrl(url, fallback)).toBe(url);
    },
  );

  it.each([
    ['a missing value', null],
    ['undefined', undefined],
    ['an empty string', ''],
    ['an absolute URL', 'https://evil.com'],
    ['a protocol-relative URL', '//evil.com'],
    ['a backslash variant of a protocol-relative URL', '/\\evil.com'],
    ['a path without a leading slash', 'evil.com'],
    ['a javascript: URL', 'javascript:alert(1)'],
    ['a URL with leading whitespace', ' //evil.com'],
    ['a URL with a tab after the first slash', '/\t/evil.com'],
  ])('falls back for %s', (_label, url) => {
    expect(resolveReturnUrl(url, fallback)).toBe(fallback);
  });
});
