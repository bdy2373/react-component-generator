/// <reference types="node" />
import { existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import { afterEach, expect, it } from 'vitest'

const script = resolve('.codex/hooks/tdd-reminder.mjs')
const evaluate = existsSync(script)
  ? (await import(/* @vite-ignore */ script)).evaluate
  : () => undefined
const roots: string[] = []
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'tdd-reminder-'))
  roots.push(root)
  writeFileSync(join(root, 'AGENTS.md'), '# Instructions\n\n## TDD Rule\n\nROOT RED-GREEN-REFACTOR\n\n## Other\n\nUNRELATED\n')
  return root
}
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }) })

it('injects the TDD section before creating a TypeScript file with apply_patch', () => {
  const root = fixture()
  const result = evaluate({ hook_event_name: 'PreToolUse', tool_name: 'apply_patch', cwd: root,
    tool_input: { command: '*** Begin Patch\n*** Add File: src/new.ts\n+export const n = 1\n*** End Patch' } }, root)
  expect(result?.hookSpecificOutput?.hookEventName).toBe('PreToolUse')
  expect(result?.hookSpecificOutput?.additionalContext).toContain('ROOT RED-GREEN-REFACTOR')
  expect(result?.hookSpecificOutput?.additionalContext).not.toContain('UNRELATED')
})

it('includes the nearest child TDD section for a TSX update', () => {
  const root = fixture()
  mkdirSync(join(root, 'src'))
  writeFileSync(join(root, 'src/AGENTS.md'), '## TDD Rule\n\nCHILD TDD OVERRIDE\n')
  const result = evaluate({ hook_event_name: 'PreToolUse', tool_name: 'apply_patch', cwd: root,
    tool_input: { command: '*** Update File: src/App.tsx\n@@\n-old\n+new' } }, root)
  expect(result?.hookSpecificOutput?.additionalContext).toContain('CHILD TDD OVERRIDE')
})

it('reminds before a structured Write call', () => {
  const root = fixture()
  expect(evaluate({ hook_event_name: 'PreToolUse', tool_name: 'Write', cwd: root,
    tool_input: { file_path: 'src/App.tsx', content: '' } }, root)?.hookSpecificOutput?.additionalContext).toContain('ROOT RED-GREEN-REFACTOR')
})

it('reminds before a PowerShell TypeScript write', () => {
  const root = fixture()
  expect(evaluate({ hook_event_name: 'PreToolUse', tool_name: 'Bash', cwd: root,
    tool_input: { command: "Set-Content -LiteralPath 'src/new.ts' -Value 'export {}'" } }, root)?.hookSpecificOutput?.additionalContext).toContain('ROOT RED-GREEN-REFACTOR')
})

it('ignores a read-only TypeScript command', () => {
  const root = fixture()
  expect(evaluate({ hook_event_name: 'PreToolUse', tool_name: 'Bash', cwd: root,
    tool_input: { command: 'Get-Content src/App.tsx' } }, root)).toBeUndefined()
})

it('ignores non-TypeScript patches', () => {
  const root = fixture()
  expect(evaluate({ hook_event_name: 'PreToolUse', tool_name: 'apply_patch', cwd: root,
    tool_input: { command: '*** Update File: src/App.css\n@@\n-a\n+b' } }, root)).toBeUndefined()
})
