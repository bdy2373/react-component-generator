import { expect, it, vi } from 'vitest';

it('provides shared global storage after restoring mocked globals', () => {
  const storage = localStorage;
  vi.stubGlobal('localStorage', {});
  vi.unstubAllGlobals();
  expect(localStorage).toBe(storage);
  expect(window.localStorage).toBe(storage);
  localStorage.setItem('example', 'value');
  expect(window.localStorage.getItem('example')).toBe('value');
  expect(localStorage.length).toBe(1);
  expect(localStorage.key(0)).toBe('example');
  localStorage.removeItem('example');
  expect(localStorage.getItem('example')).toBeNull();
  localStorage.setItem('example', 'value');
  localStorage.clear();
  expect(localStorage.length).toBe(0);
});
