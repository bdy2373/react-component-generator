import type { GeneratedComponent, Provider } from '../types';

interface Settings { provider: Provider; apiKey: string }
export const DEFAULT_SETTINGS: Settings = { provider: 'google', apiKey: '' };

export function decodeSettings(value: unknown): Settings {
  if (typeof value !== 'object' || value === null) return DEFAULT_SETTINGS;
  const settings = value as Record<string, unknown>;
  if ((settings.provider !== 'google' && settings.provider !== 'anthropic') || typeof settings.apiKey !== 'string') {
    return DEFAULT_SETTINGS;
  }
  return { provider: settings.provider, apiKey: settings.apiKey };
}

export function decodeHistory(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && !!item.trim()) : [];
}

export function decodeComponents(value: unknown): GeneratedComponent[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item: unknown) => {
    if (typeof item !== 'object' || item === null) return [];
    const entry = item as Record<string, unknown>;
    if (typeof entry.id !== 'string' || typeof entry.prompt !== 'string' || typeof entry.code !== 'string' || typeof entry.createdAt !== 'string') return [];
    const createdAt = new Date(entry.createdAt);
    return Number.isNaN(createdAt.getTime()) ? [] : [{ id: entry.id, prompt: entry.prompt, code: entry.code, createdAt }];
  });
}
