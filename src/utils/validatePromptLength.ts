export const MAX_PROMPT_LENGTH = 500;

/** 공백과 줄바꿈을 포함한 원문을 JavaScript 문자열 길이 기준으로 검사한다. */
export function validatePromptLength(prompt: string): boolean {
  return prompt.length <= MAX_PROMPT_LENGTH;
}
