export type Mode = 'boolean' | 'choice' | 'score';
export type Question = { type: 'boolean'; instructions: string } | { type: 'choice'; instructions: string; criteria: Record<string, string> } | { type: 'score'; instructions: string; criteria: string[] };
export type Answer = { type: 'boolean'; probability: number } | { type: 'choice'; choice: string; probabilities?: Record<string, number> } | { type: 'score'; score: number; probabilities?: Record<string, number> };
export function parseEvaluation(body: unknown): { state: string; question: Question; labels: string[] } {
  if (!body || typeof body !== 'object') throw new Error('내용과 질문을 입력해 주세요.');
  const b = body as Record<string, unknown>;
  const mode = b.mode ?? 'boolean';
  if (typeof b.state !== 'string' || !b.state.trim() || b.state.length > 12000) throw new Error('평가할 내용을 1~12,000자로 입력해 주세요.');
  if (typeof b.question !== 'string' || !b.question.trim() || b.question.length > 1000) throw new Error('질문을 1~1,000자로 입력해 주세요.');
  const instructions = b.question.trim();
  if (mode === 'boolean') return { state: b.state.trim(), question: { type: 'boolean', instructions }, labels: [] };
  if (mode !== 'choice' && mode !== 'score') throw new Error('평가 방식을 다시 선택해 주세요.');
  if (!Array.isArray(b.options) || b.options.length < 2 || b.options.length > 8 || b.options.some(x => typeof x !== 'string' || !x.trim() || x.length > 300)) throw new Error('선택지 또는 점수 기준을 2~8개 입력해 주세요. 각 항목은 300자 이내입니다.');
  const labels = (b.options as string[]).map(x => x.trim());
  if (new Set(labels).size !== labels.length) throw new Error('중복되는 선택지 또는 기준을 수정해 주세요.');
  const question: Question = mode === 'choice' ? { type: 'choice', instructions, criteria: Object.fromEntries(labels.map((x, i) => [`option_${i}`, x])) } : { type: 'score', instructions, criteria: labels };
  return { state: b.state.trim(), question, labels };
}
export function publicFailure(error: unknown) {
  const chain: {name?: string; statusCode?: number}[] = [];
  let current: unknown = error;
  for (let i = 0; i < 5 && current && typeof current === 'object'; i++) {
    const e = current as {name?: string; statusCode?: number; cause?: unknown; lastError?: unknown};
    chain.push({name: e.name, statusCode: e.statusCode});
    current = e.lastError ?? e.cause;
  }
  const status = chain.find(x => typeof x.statusCode === 'number')?.statusCode;
  const names = chain.map(x => x.name ?? '');
  if (status === 401 || status === 403 || names.some(x => /Authentication|Forbidden|LoadAPIKey/.test(x))) return {code:'AUTH_REQUIRED',status:503,error:'AI Gateway 인증이 필요합니다. Vercel 환경변수에 AI_GATEWAY_API_KEY를 등록한 뒤 재배포해 주세요.'};
  if (status === 402) return {code:'CREDITS_REQUIRED',status:503,error:'AI Gateway에서 사용 가능한 크레딧을 확인해 주세요.'};
  if (status === 429) return {code:'RATE_LIMITED',status:429,error:'요청이 많습니다. 잠시 후 다시 시도해 주세요.'};
  if (status === 408 || status === 504 || names.some(x => /Timeout|Abort/.test(x))) return {code:'TIMEOUT',status:504,error:'평가 응답이 늦어지고 있어요. 잠시 후 다시 시도해 주세요.'};
  if (names.some(x => /NoSuchModel|UnsupportedModel/.test(x)) || status === 404) return {code:'MODEL_UNAVAILABLE',status:502,error:'현재 Gateway에서 Jev 평가 모델에 연결할 수 없습니다.'};
  if (names.some(x => /Validation|InvalidResponse|Parse/.test(x))) return {code:'INVALID_RESPONSE',status:502,error:'Jev 응답 형식을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.'};
  if (status === 400) return {code:'UPSTREAM_REQUEST',status:502,error:'Jev에서 평가 요청을 처리하지 못했습니다. 질문과 평가 기준을 확인해 주세요.'};
  return {code:'UPSTREAM_UNAVAILABLE',status:502,error:'현재 Jev 연결에 문제가 있습니다. 잠시 후 다시 시도해 주세요.'};
}
