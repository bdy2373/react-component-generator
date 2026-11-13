import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PromptInput } from './PromptInput';

describe('PromptInput', () => {
  it('501자 입력 시 오류를 안내하고 버튼과 단축키 제출을 차단한다', async () => {
    const onGenerate = vi.fn();
    const user = userEvent.setup();
    render(<PromptInput onGenerate={onGenerate} isLoading={false} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '가'.repeat(501) } });

    expect(screen.getByRole('button', { name: '컴포넌트 생성' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('프롬프트는 500자 이하로 입력해주세요.');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    await user.click(input);
    await user.keyboard('{Control>}{Enter}{/Control}');
    await user.keyboard('{Meta>}{Enter}{/Meta}');
    expect(onGenerate).not.toHaveBeenCalled();
  });

  it('500자까지 허용하며 초과 입력을 줄이면 오류가 해제된다', async () => {
    const onGenerate = vi.fn();
    const user = userEvent.setup();
    render(<PromptInput onGenerate={onGenerate} isLoading={false} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '가'.repeat(501) } });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    fireEvent.change(input, { target: { value: '가'.repeat(500) } });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '컴포넌트 생성' }));
    expect(onGenerate).toHaveBeenCalledWith('가'.repeat(500));
  });

  it('프롬프트가 비어 있으면 생성 버튼이 비활성이다', () => {
    render(<PromptInput onGenerate={vi.fn()} isLoading={false} />);
    expect(screen.getByRole('button', { name: '컴포넌트 생성' })).toBeDisabled();
  });

  it('입력하면 버튼이 활성화되고 클릭 시 입력값으로 onGenerate가 호출된다', async () => {
    const onGenerate = vi.fn();
    const user = userEvent.setup();
    render(<PromptInput onGenerate={onGenerate} isLoading={false} />);

    await user.type(screen.getByRole('textbox'), '프로필 카드');
    const submit = screen.getByRole('button', { name: '컴포넌트 생성' });
    expect(submit).toBeEnabled();

    await user.click(submit);
    expect(onGenerate).toHaveBeenCalledWith('프로필 카드');
  });

  it('로딩 중에는 생성 버튼이 비활성이고 "생성 중..." 을 보여준다', () => {
    render(<PromptInput onGenerate={vi.fn()} isLoading={true} />);
    expect(screen.getByRole('button', { name: '생성 중...' })).toBeDisabled();
  });
});
