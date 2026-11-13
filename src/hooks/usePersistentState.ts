import { useEffect, useState } from 'react';

export function usePersistentState<T>(key: string, fallback: T, decode: (value: unknown) => T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = window.localStorage.getItem(key);
      return saved === null ? fallback : decode(JSON.parse(saved));
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage may be unavailable or full; keep the current session usable.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
