import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const reason = '전체 테스트가 실패했거나 실행되지 않았습니다. 커밋을 차단합니다. Codex는 작업을 중단하고 실패를 보고하세요. 우회하지 마세요.'

export async function evaluate(event, runTests) {
  const input = JSON.stringify(event.tool_input ?? {})
  if (event.hook_event_name === 'PostToolUse') {
    const response = event.tool_response
    const failed = (typeof response?.exit_code === 'number' && response.exit_code !== 0)
      || (typeof response?.exitCode === 'number' && response.exitCode !== 0)
      || /(?:exited with code|exit_code["\s:]+)\s*[1-9]\d*/i.test(JSON.stringify(response))
    if (/\b(?:bun\s+run\s+test|vitest)\b/i.test(input) && failed) {
      return { continue: false, stopReason: reason, systemMessage: reason }
    }
    return undefined
  }
  if (!/\bcommit\b/i.test(input)) return undefined
  let status
  try { status = await runTests() } catch { status = 1 }
  if (status === 0) return undefined
  return { hookSpecificOutput: {
    hookEventName: 'PreToolUse',
    permissionDecision: 'deny',
    permissionDecisionReason: reason,
  } }
}

if (import.meta.main) {
  const root = fileURLToPath(new URL('../../', import.meta.url))
  try {
    const event = await Bun.stdin.json()
    const result = await evaluate(event, () => spawnSync('bun', ['run', 'test'], {
      cwd: root,
      stdio: ['ignore', 'ignore', 'ignore'],
      timeout: 120000,
    }).status)
    if (result) console.log(JSON.stringify(result))
  } catch {
    console.log(JSON.stringify({ hookSpecificOutput: {
      hookEventName: 'PreToolUse', permissionDecision: 'deny',
      permissionDecisionReason: reason,
    } }))
  }
}
