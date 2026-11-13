import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { dirname, isAbsolute, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

function tddSection(file) {
  const text = readFileSync(file, 'utf8')
  return text.match(/^## TDD[^\r\n]*\r?\n[\s\S]*?(?=^## |$(?![\s\S]))/m)?.[0]?.trim()
}

function within(root, path) {
  const rel = relative(root, path)
  return rel !== '..' && !rel.startsWith('..\\') && !rel.startsWith('../') && !isAbsolute(rel)
}

function rulesFor(root, path, cwd) {
  let dir = dirname(resolve(cwd, path))
  if (!within(root, dir)) return '프로젝트 밖 경로입니다. 해당 경로의 AGENTS.md를 직접 확인하세요.'
  while (within(root, dir)) {
    const file = resolve(dir, 'AGENTS.md')
    if (existsSync(file) && within(realpathSync(root), realpathSync(file))) {
      const section = tddSection(file)
      if (section) return `${relative(root, file)}\n${section}`
    }
    if (dir === root) break
    dir = dirname(dir)
  }
  return 'AGENTS.md의 TDD 규칙 섹션을 직접 확인하세요.'
}

export function evaluate(event, root) {
  if (event.hook_event_name !== 'PreToolUse') return undefined
  const input = event.tool_input ?? {}
  const command = typeof input === 'string' ? input : (input.command ?? input.cmd ?? '')
  let paths = []
  if (event.tool_name === 'apply_patch') {
    paths = [...command.matchAll(/^\*\*\* (?:Add|Update) File: (.+\.tsx?)\r?$/gm)].map(match => match[1])
  } else if (/write|edit|create/i.test(event.tool_name ?? '')) {
    const path = input.file_path ?? input.path ?? input.filePath
    if (typeof path === 'string' && /\.tsx?$/.test(path)) paths = [path]
  } else if (event.tool_name === 'Bash' && /(?:Set-Content|Add-Content|Out-File|New-Item|writeFile|\btee\b|>|\b(?:python|node|bun)\b.*\s-[ec]\b)/i.test(command)) {
    // Shell inspection is conservative; dynamically computed paths cannot be resolved here.
    paths = [...command.matchAll(/(?:"([^"\r\n]+\.tsx?)"|'([^'\r\n]+\.tsx?)'|([^\s'";|<>]+\.tsx?))(?=$|[\s'";|<>)])/g)]
      .map(match => match[1] ?? match[2] ?? match[3])
  }
  if (!paths.length) return undefined
  const section = [...new Set(paths.map(path => rulesFor(root, path, event.cwd ?? root)))].join('\n\n')
  return { hookSpecificOutput: {
    hookEventName: 'PreToolUse',
    additionalContext: `TDD 리마인더 — TypeScript 생성·수정 전에 확인하세요.\n대상: ${paths.join(', ')}\n이번 변경이 TDD 필수 대상인지 판단하고, 필수라면 동작별 테스트를 먼저 실행해 기능 부재에 의한 RED를 확인했는지 점검하세요. RED 확인 전 프로덕션 코드를 작성하지 마세요. GREEN 후 리팩터링하며 테스트를 유지하세요. 예외와 하위 규칙 우선순위도 아래 원문에 따라 판단하세요.\n\n${section ?? 'AGENTS.md의 TDD 규칙 섹션을 직접 확인하세요.'}`,
  } }
}

if (import.meta.main) {
  const root = fileURLToPath(new URL('../../', import.meta.url))
  try {
    const result = evaluate(await Bun.stdin.json(), root)
    if (result) console.log(JSON.stringify(result))
  } catch {
    console.log(JSON.stringify({ hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      additionalContext: 'TDD 리마인더를 불러오지 못했습니다. .ts/.tsx 생성·수정 전 적용되는 AGENTS.md의 TDD 규칙을 직접 읽고 RED-GREEN-REFACTOR 준수 여부를 확인하세요.',
    } }))
  }
}
