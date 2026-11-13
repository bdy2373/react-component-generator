import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';

vi.mock('./components/ComponentCard', () => ({
  ComponentCard: ({ component, onRemove }: { component: { id: string; prompt: string; createdAt: Date }; onRemove: (id: string) => void }) =>
    <article>{component.prompt}<time>{component.createdAt.toISOString()}</time><button onClick={() => onRemove(component.id)}>결과 삭제</button></article>,
}));

beforeEach(() => {
  const entries = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => entries.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { entries.set(key, value); }),
  });
  vi.stubGlobal('fetch', vi.fn(async (url: string) => url === '/api/config'
    ? { json: async () => ({ envKeys: { google: false, anthropic: false } }) }
    : { ok: true, json: async () => ({ code: 'render(<div>Hello</div>)' }) }));
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it('입력한 API 키와 Provider를 새로 마운트해도 복원한다', () => {
  const view = render(<App />);
  fireEvent.change(screen.getByLabelText('AI 서비스'), { target: { value: 'anthropic' } });
  fireEvent.change(screen.getByLabelText('API 키'), { target: { value: 'test-key' } });
  view.unmount();
  render(<App />);
  expect(screen.getByLabelText('AI 서비스')).toHaveValue('anthropic');
  expect(screen.getByLabelText('API 키')).toHaveValue('test-key');
});

it('Provider 변경 시 저장한 API 키도 비운다', () => {
  const view = render(<App />);
  fireEvent.change(screen.getByLabelText('API 키'), { target: { value: 'test-key' } });
  fireEvent.change(screen.getByLabelText('AI 서비스'), { target: { value: 'anthropic' } });
  view.unmount();
  render(<App />);
  expect(screen.getByLabelText('API 키')).toHaveValue('');
});

it('생성 결과를 날짜와 함께 복원하고 삭제도 유지한다', async () => {
  const view = render(<App />);
  fireEvent.change(screen.getByLabelText('API 키'), { target: { value: 'test-key' } });
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '프로필 카드' } });
  fireEvent.click(screen.getByRole('button', { name: '컴포넌트 생성' }));
  await screen.findByRole('article');
  view.unmount();
  const restored = render(<App />);
  expect(screen.getByRole('article')).toHaveTextContent('프로필 카드');
  fireEvent.click(screen.getByRole('button', { name: '결과 삭제' }));
  restored.unmount();
  render(<App />);
  expect(screen.queryByRole('article')).not.toBeInTheDocument();
});

it('실패한 생성 프롬프트도 히스토리에 보관하고 복원해 재사용한다', async () => {
  vi.mocked(fetch).mockImplementation(async (url) => (url === '/api/config'
    ? { json: async () => ({ envKeys: { google: false, anthropic: false } }) }
    : { ok: false, json: async () => ({ error: '실패' }) }) as Response);
  const view = render(<App />);
  fireEvent.change(screen.getByLabelText('API 키'), { target: { value: 'test-key' } });
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '재사용할 프롬프트' } });
  fireEvent.click(screen.getByRole('button', { name: '컴포넌트 생성' }));
  await screen.findByRole('alert');
  view.unmount();
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: '재사용할 프롬프트' }));
  expect(screen.getByRole('textbox')).toHaveValue('재사용할 프롬프트');
});

it('전체 삭제한 생성 결과는 복원되지 않는다', async () => {
  const view = render(<App />);
  fireEvent.change(screen.getByLabelText('API 키'), { target: { value: 'test-key' } });
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '카드' } });
  fireEvent.click(screen.getByRole('button', { name: '컴포넌트 생성' }));
  await screen.findByRole('article');
  fireEvent.click(screen.getByRole('button', { name: '전체 삭제' }));
  view.unmount();
  render(<App />);
  expect(screen.queryByRole('article')).not.toBeInTheDocument();
});

it('손상된 저장 데이터는 기본 상태로 대체한다', () => {
  for (const key of ['settings', 'components', 'prompt-history']) {
    window.localStorage.setItem(`component-studio:${key}`, JSON.stringify({ invalid: true }));
  }
  render(<App />);
  expect(screen.getByLabelText('AI 서비스')).toHaveValue('google');
  expect(screen.getByLabelText('API 키')).toHaveValue('');
  expect(screen.queryByRole('article')).not.toBeInTheDocument();
});

it('스토리지 접근이 차단돼도 입력과 생성을 계속한다', async () => {
  vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
  vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => { throw new Error('quota'); });
  render(<App />);
  fireEvent.change(screen.getByLabelText('API 키'), { target: { value: 'test-key' } });
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '카드' } });
  fireEvent.click(screen.getByRole('button', { name: '컴포넌트 생성' }));
  await waitFor(() => expect(screen.getByRole('article')).toHaveTextContent('카드'));
});


