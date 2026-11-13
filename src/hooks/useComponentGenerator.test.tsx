import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useComponentGenerator } from './useComponentGenerator';

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

it('shows streamed code before generation finishes', async () => {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({
    start(value) { controller = value; },
  });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body, {
    headers: { 'Content-Type': 'application/x-ndjson' },
  })));
  const { result } = renderHook(() => useComponentGenerator());
  let generation!: Promise<void>;
  act(() => { generation = result.current.generate('button', 'test-key', 'google'); });
  await act(async () => {
    controller.enqueue(new TextEncoder().encode(JSON.stringify({ code: 'const Button = () =>', done: false }) + '\n'));
  });
  try {
    await waitFor(() => {
      expect(result.current.components[0]?.code).toBe('const Button = () =>');
      expect(result.current.isLoading).toBe(true);
    });
  } finally {
    await act(async () => {
      controller.enqueue(new TextEncoder().encode(JSON.stringify({ code: 'render(<button />);', done: true }) + '\n'));
      controller.close();
      await generation;
    });
  }
  expect(result.current.components[0]?.code).toBe('render(<button />);');
  expect(result.current.isLoading).toBe(false);
});
