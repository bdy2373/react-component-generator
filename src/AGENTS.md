# Frontend Instructions

## Module Context

프롬프트와 연결 설정을 받아 생성 결과를 관리하고 브라우저에서 미리보기를 실행한다. API 응답 계약과 생성 코드 실행 계약은 루트 규칙을 따른다.

## Tech Stack & Constraints

React 19, TypeScript 5.9, react-live 4. 앱 UI는 CSS 파일을 사용하며 생성 코드에만 인라인 스타일 제약이 적용된다.

## Implementation Patterns

- 화면 설정은 App, 생성 요청·결과·오류 상태는 `useComponentGenerator`가 소유한다. 새 기능도 해당 책임 경계를 기준으로 배치한다. 근거: [App.tsx](App.tsx:13), [useComponentGenerator.ts](hooks/useComponentGenerator.ts:13).
- API 요청에는 상대 경로 `/api`를 사용한다. 개발 연결은 루트 Vite 프록시가 담당하므로 브라우저 코드에 서버 포트를 하드코딩하지 않는다. 근거: [요청](hooks/useComponentGenerator.ts:23), [프록시](../vite.config.ts:9).

## Testing Strategy

- 저장소 루트에서 `bun run test -- src/components/PromptInput.test.tsx`를 실행한다. 추가 테스트도 `src/**/*.test.{ts,tsx}` 범위에 둔다.
- 사용자 입력은 Testing Library의 role/label과 `userEvent`로 검증한다. 공통 setup이 매 테스트 후 DOM을 정리한다. 근거: [기존 테스트](components/PromptInput.test.tsx:12), [setup](test/setup.ts:1).
- 현재 UI 자동 테스트는 입력 활성화·콜백·로딩 비활성만 보장한다. API 요청 훅, 클립보드, 런타임 미리보기 검증까지 통과했다고 해석하지 않는다. 관련 동작 변경 시 해당 경계의 검증을 추가하거나 직접 확인한다.
- 테마 변경 시 데스크톱과 모바일 배치, 키보드 포커스, 모션 감소 설정을 확인한다.

## Local Golden Rules

- **이중 방어:** 생성 버튼의 disabled와 submit 내부의 공백·로딩 검사를 함께 유지한다. Ctrl/Cmd+Enter도 같은 submit 검사를 통과해야 한다. 근거: [submit](components/PromptInput.tsx:20), [단축키](components/PromptInput.tsx:46), [버튼](components/PromptInput.tsx:56).
- **재실행의 구분:** 새로고침은 `previewKey`로 리마운트하고, 재생성은 원래 프롬프트로 새 API 요청을 보낸다. 두 동작을 혼동하지 않는다. 현재 재생성은 기존 결과를 덮어쓰지 않고 앞에 추가한다. 근거: [카드 액션](components/ComponentCard.tsx:30), [리마운트](components/ComponentCard.tsx:70), [결과 추가](hooks/useComponentGenerator.ts:42).
- **타입 경계:** `createdAt`은 Date이며 카드에서 직접 `toLocaleTimeString`을 호출한다. 결과를 저장·복원하는 기능에서는 문자열을 Date로 복원한다. 근거: [타입](types/index.ts:7), [생성](hooks/useComponentGenerator.ts:39), [표시](components/ComponentCard.tsx:18).
- **키 전환:** Provider를 바꾸면 직접 입력한 API 키를 비워 다른 서비스로 재사용되지 않게 한다. 근거: [전환 처리](App.tsx:41).
- **실행 경계:** 현재 미리보기는 iframe 샌드박스가 아니다. `LiveError`나 코드 보정 함수를 보안 격리로 간주하지 않으며 환경변수 키를 미리보기 scope에 전달하지 않는다. 근거: [실행과 오류 표시](components/LivePreview.tsx:14).
- **스타일 기준:** 레트로 테마는 기존 색상 토큰과 반응형 분기를 확장하고 포커스·모션 감소 처리를 보존한다. 근거: [토큰](App.css:1), [반응형](App.css:90), [모션 감소](App.css:93), [포커스](index.css:7).
