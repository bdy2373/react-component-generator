# Agent Instructions

## Operational Commands

- Bun을 사용하고 의존성 변경은 기존 bun.lock에 반영한다. 다른 패키지 매니저의 잠금 파일을 추가하지 않는다.
- `bun run dev`: 프론트엔드와 API 동시 실행. `bun run server`: API만 실행. 먼저 기존 프로세스와 포트 사용 여부를 확인한다.
- `bun run build`: TypeScript 프로젝트 검사와 프론트엔드 빌드.
- `bun run lint`: ESLint. `bun run test`: Vitest 일회 실행. `bun run test:watch`: Vitest 감시 모드.
- `bun run preview`: 빌드된 프론트엔드 확인용. API 실행이나 개발용 API 프록시를 대신하지 않는다.
- 테스트는 `bun test` 대신 위 스크립트를 사용한다. jsdom, 공통 setup, 대상 파일은 [vite.config.ts](vite.config.ts:16)에 정의되어 있다.

## Golden Rules

- **실행 계약:** 앱의 TypeScript와 AI가 반환하는 JavaScript/JSX를 구분한다. 생성물은 import 없이 자기 완결적으로 작성하며 인라인 스타일과 render 호출을 사용한다. 생성 지시와 미리보기 실행 방식을 한쪽만 변경하지 않는다. 근거: [생성 지시](server/index.ts:10), [TypeScript 금지](server/index.ts:20), [noInline](src/components/LivePreview.tsx:14).
- **보안 경계:** 서버 환경변수 키 값을 설정 API나 프론트엔드 빌드 변수로 공개하지 않는다. 설정 API는 키 유무만 반환한다. 근거: [환경변수](server/index.ts:59), [설정 응답](server/index.ts:150), [설정 조회](src/App.tsx:24).
- **이중 방어:** UI 입력 검사를 이유로 서버의 키·프롬프트 검사를 삭제하지 않는다. API를 직접 호출할 수 있음을 전제로 한다. 근거: [키 확인](src/App.tsx:33), [입력 확인](src/components/PromptInput.tsx:20), [서버 확인](server/index.ts:167). 현재 검사는 포괄적인 런타임 스키마 검증이 아니다.
- **검증 경계:** 빌드 성공을 서버 타입 검사 성공으로 보고하지 않는다. 현재 TypeScript 참조는 src와 Vite 설정만 포함한다. 근거: [참조 설정](tsconfig.json:3), [앱 대상](tsconfig.app.json:27), [설정 대상](tsconfig.node.json:25). 서버 변경 검증은 하위 규칙을 따른다.

## TDD Rule

**이 규칙은 Rigid — 상황에 맞게 변형하지 마라.**

### 적용 기준

- **필수:** 비즈니스 로직, API, 유틸리티의 추가·변경, 버그 수정. 버그 수정은 재현 테스트부터 작성한다.
- **불필요:** 타입 정의, 설정 파일, 순수 UI(레이아웃·스타일), SQL. TDD가 불필요해도 해당 변경에 필요한 검증은 수행한다.
- UI에 비즈니스 로직이나 API 동작 변경이 섞여 있으면 **해당 동작에는 TDD를 적용**한다.

### RED-GREEN-REFACTOR

1. **RED:** 원하는 동작의 테스트를 먼저 작성한다. **하나의 동작 = 하나의 테스트.** 반드시 실행해 실패를 확인한다. 실패 원인은 **기능 미구현 또는 수정 대상 동작의 부재**여야 한다. 문법 오류·잘못된 import·환경 문제로 인한 실패는 RED로 인정하지 않는다. 테스트가 이미 통과하면 미구현 동작을 검증하는지 다시 확인한다.
2. **GREEN:** 실패한 테스트를 통과시키는 **최소한의 프로덕션 코드만** 작성한다. **YAGNI**를 지키고 예상 기능·불필요한 추상화를 추가하지 않는다. **신규 테스트와 기존 테스트가 모두 통과**하는지 실행해 확인한다.
3. **REFACTOR:** 중복 제거, 이름 개선, 헬퍼 추출로 구조를 정리한다. 변경할 때마다 테스트를 실행해 **GREEN을 유지**한다. **새 동작을 추가하지 않는다.**
4. **반복:** 다음 동작의 **RED로 돌아간다.**

### 삭제 강제 규칙

- TDD 적용 대상에서 **실패하는 테스트를 확인하기 전에 작성한 프로덕션 코드는 삭제하고 RED부터 재시작**한다.
- 삭제 대상은 이번 동작을 위해 먼저 작성한 코드다. 기존 코드나 사용자의 무관한 변경을 삭제하지 않는다.
- 먼저 작성한 코드를 **참고용으로 남기거나 복사·주석 처리해 보관하는 것도 금지**한다.

### 변명 차단표

| 변명 | 반론 |
| --- | --- |
| 너무 단순해서 테스트 불필요 | **적용 대상이면 복잡도와 무관하게** 테스트부터 작성한다. |
| 나중에 추가하겠다 | 사후 테스트는 RED 확인을 대신하지 못한다. **지금 테스트부터 작성한다.** |
| 시간이 없다 | 절차 생략 대신 구현 범위를 줄인다. **최소 동작의 RED부터 시작한다.** |
| 삭제하면 낭비 | 이미 쓴 코드는 순서 위반의 근거가 될 수 없다. **삭제하고 재시작한다.** |
| 프로토타입이다 | 프로토타입도 **적용 대상이면 동일한 사이클**을 따른다. |

### 하위 규칙 우선

이 섹션은 **전역 기본값(fallback)**이다. 작업 경로의 하위 디렉토리 `AGENTS.md`에 별도 TDD 규칙이 있으면 **가장 가까운 하위 TDD 규칙을 우선**한다. 별도 규칙이 없으면 이 섹션을 적용한다.

## Project Context

사용자 관점의 목적과 사용법은 [README.md](README.md)를 참조한다. 변경 시 생성부터 미리보기·코드 가져오기까지의 작업 흐름을 유지한다.

기술: React 19, TypeScript 5.9, Vite 8, Bun, react-live 4, Vitest 4.

## Standards & References

- TypeScript strict, 타입 전용 import와 기존 ESLint 설정에 맞춘다. 근거: [tsconfig.app.json](tsconfig.app.json:13), [eslint.config.js](eslint.config.js:8).
- 변경 범위에 맞는 빌드·lint·테스트를 선택하고 미실시 검증은 완료로 보고하지 않는다. 문서만 변경하면 링크·근거·내용의 정합성을 확인한다.
- 커밋 요청 시 [commit 스킬](.agents/skills/commit/SKILL.md)에 따라 논리 단위로 `feat/fix/refactor/chore: 한국어 요약` 메시지를 작성하며 추가 승인을 요청하지 않는다. 별도 요청 없이 push나 이력 재작성을 하지 않는다.
- 규칙과 코드의 괴리를 발견하면 근거를 확인하고 업데이트를 제안한다. 각 AGENTS.md는 500행 미만을 유지하고 README의 소개·구조·설치 절차를 복제하지 않는다.

## Context Map

- **[UI·상태·미리보기 변경](src/AGENTS.md)** — 브라우저 조작과 생성 결과 처리 시.
- **[API·AI 호출·코드 보정 변경](server/AGENTS.md)** — Bun 런타임과 Provider별 동작 수정 시.
