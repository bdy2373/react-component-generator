# Server Instructions

## Module Context

Bun API가 두 AI 서비스의 응답을 코드 문자열로 통합하고 프론트엔드가 실행할 형식으로 정리한다. 외부 호출과 순수 코드 보정·폴백 함수를 분리한다.

## Tech Stack & Constraints

Bun 런타임, TypeScript, 내장 fetch, Anthropic Messages API, Google generateContent API. Node 전용 실행 명령으로 `Bun.serve` 진입점을 대체하지 않는다.

## Implementation Patterns

- 성공 응답은 `{ code }`, 실패 응답은 `{ error }` 형태를 유지한다. HTTP 상태 처리 변경 시 클라이언트의 `res.ok`와 오류 메시지 처리도 확인한다. 근거: [응답](index.ts:190), [오류](index.ts:194), [클라이언트](../src/hooks/useComponentGenerator.ts:29).
- 코드 보정과 모델 순회 로직은 서버를 시작하지 않고 import할 수 있게 유지한다. 근거: [순수 함수](generator.ts:1), [폴백 함수](fallback.ts:3), [서버 시작](index.ts:138).

## Testing Strategy

- 저장소 루트에서 `bun run test -- server/generator.test.ts server/fallback.test.ts`를 실행한다.
- 코드 보정 변경 시 코드펜스 유무, 기존 render 유지, const/function 선언, 컴포넌트 미검출 사례를 확인한다. 근거: [generator.test.ts](generator.test.ts:4).
- 폴백 변경 시 첫 성공에서 중단, 다음 모델 시도, 전체 실패의 마지막 오류, 빈 목록을 확인한다. 근거: [fallback.test.ts](fallback.test.ts:4).
- 현재 테스트는 순수 함수만 검사하며 실제 API 라우트·외부 AI 요청은 검증하지 않는다. 라우팅이나 응답 파싱을 바꾸면 fetch 모킹 또는 별도 로컬 검증을 선택하고 결과를 구분해 보고한다. 단위 테스트에서 `index.ts`를 import해 실제 리스너를 열거나 실제 API 키로 요청하지 않는다.
- 루트 build는 이 영역을 타입 검사하지 않는다. 서버 변경에 타입 검증이 필요하면 별도 설정을 마련하거나 명시적인 검사 결과를 보고한다.

## Local Golden Rules

- **응답 비대칭:** Google의 `MAX_TOKENS`는 잘린 코드이므로 성공 코드로 반환하지 않는다. Google 후보 파싱과 Anthropic text 블록 파싱을 동일 구조라고 가정하지 않는다. 근거: [Anthropic 응답](index.ts:88), [Google 응답](index.ts:115), [잘림 검사](index.ts:123).
- **폴백 비대칭:** 현재 모델 순차 폴백은 Google 전용이다. `withModelFallback`은 첫 성공을 반환하고 모두 실패하면 마지막 오류를 던진다. 병렬 실행·조용한 오류 무시로 바꾸지 않는다. 정책 변경 시 전용 테스트도 갱신한다. 근거: [호출](index.ts:134), [모델 순서](index.ts:5), [구현](fallback.ts:7).
- **이중 방어:** 시스템 프롬프트의 형식 지시가 있어도 코드펜스 제거 후 render 보완을 수행한다. 이 보정은 정규식 기반 편의 처리이며 구문 검증이나 악성 코드 제거가 아니다. 근거: [생성 지시](index.ts:16), [보정 순서](index.ts:188), [정규식](generator.ts:16).
- **키 우선순위:** 직접 입력한 키가 환경변수보다 우선한다. 환경변수는 모듈 로드 시 읽으므로 실행 중 `.env` 변경은 서버 재시작 여부를 확인한다. 근거: [키 로드와 결정](index.ts:59).
- **기본값 비대칭:** 요청에서 Provider를 생략하면 서버는 Anthropic을 사용하지만 UI 기본값은 Google이다. 기능 추가 시 명시적으로 Provider를 전달하며 기본값을 우연히 일치한다고 가정하지 않는다. 근거: [서버 기본값](index.ts:161), [UI 기본값](../src/App.tsx:16), [전송](../src/hooks/useComponentGenerator.ts:26).
- **포트 결합:** 서버 포트를 바꾸면 개발 프록시 대상도 함께 수정한다. 근거: [리스너](index.ts:139), [프록시](../vite.config.ts:11).
