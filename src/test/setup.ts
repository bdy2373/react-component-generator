import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';

const entries = new Map<string, string>();
const storage: Storage = {
  get length() { return entries.size; },
  clear() { entries.clear(); },
  getItem(key) { return entries.get(String(key)) ?? null; },
  key(index) { return Array.from(entries.keys())[index] ?? null; },
  removeItem(key) { entries.delete(String(key)); },
  setItem(key, value) { entries.set(String(key), String(value)); },
};

// Node의 localStorage 대신 모든 jsdom 테스트가 같은 브라우저 저장소를 사용한다.
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  writable: true,
  value: storage,
});
Object.defineProperty(window, 'localStorage', {
  configurable: true,
  writable: true,
  value: storage,
});

beforeEach(() => {
  storage.clear();
});

// 각 테스트 후 렌더된 DOM을 정리해 테스트 간 격리를 보장한다.
afterEach(() => {
  cleanup();
});
