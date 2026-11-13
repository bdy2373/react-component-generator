/// <reference types="node" />
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, it, vi } from 'vitest'

const path = resolve('.codex/hooks/commit-protection.mjs')
const evaluate = existsSync(path)
  ? (await import(/* @vite-ignore */ path)).evaluate
  : async () => undefined

it('denies a commit when the complete test suite fails', async () => {
  const run = vi.fn(() => 1)
  const result = await evaluate({ tool_input: { command: 'git commit -m change' } }, run)
  expect(result?.hookSpecificOutput?.permissionDecision).toBe('deny')
  expect(run).toHaveBeenCalledOnce()
})

it('stops the Codex turn after a failing test command', async () => {
  const result = await evaluate({ hook_event_name: 'PostToolUse', tool_input: { command: 'bun run test' }, tool_response: { exit_code: 1 } }, vi.fn())
  expect(result?.continue).toBe(false)
})

it('permits a commit after the full suite passes', async () => {
  const run = vi.fn(() => 0)
  expect(await evaluate({ tool_input: { command: 'git -C repo commit -m change' } }, run)).toBeUndefined()
  expect(run).toHaveBeenCalledOnce()
})

it('does not run tests for an unrelated tool call', async () => {
  const run = vi.fn()
  expect(await evaluate({ tool_input: { command: 'git status' } }, run)).toBeUndefined()
  expect(run).not.toHaveBeenCalled()
})

it('denies a commit if the test runner cannot start', async () => {
  const result = await evaluate({ tool_input: { command: 'git commit' } }, () => { throw new Error('runner unavailable') })
  expect(result?.hookSpecificOutput?.permissionDecision).toBe('deny')
})
