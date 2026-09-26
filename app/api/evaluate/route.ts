import { experimental_evaluate as evaluate, APICallError } from 'ai';

export const runtime = 'nodejs';
export const maxDuration = 60;
const reply = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return reply({ error: '입력 형식이 올바르지 않습니다.' }, 400); }
  if (!body || typeof body !== 'object') return reply({ error: '내용과 평가 질문을 입력해 주세요.' }, 400);
  const { state, question } = body as Record<string, unknown>;
  if (typeof state !== 'string' || !state.trim() || state.length > 12000 || typeof question !== 'string' || !question.trim() || question.length > 1000) {
    return reply({ error: '내용은 1~12,000자, 질문은 1~1,000자로 입력해 주세요.' }, 400);
  }
  try {
    const result = await evaluate({
      model: 'typesafe-ai/jev',
      state: state.trim(),
      questions: { assessment: { type: 'boolean', instructions: question.trim() } },
      abortSignal: AbortSignal.timeout(45000),
      maxRetries: 1,
    });
    return reply({ probability: result.answers.assessment.probability, question: question.trim() });
  } catch (error) {
    const status = APICallError.isInstance(error) ? error.statusCode : undefined;
    // Do not log source text, authentication headers or full upstream errors.
    console.error('Jev evaluation failed', { name: error instanceof Error ? error.name : 'Unknown', status });
    if (status === 401 || status === 403 || (error instanceof Error && /api.?key|credentials|authentication/i.test(error.message))) {
      return reply({ error: 'AI Gateway 인증을 확인해 주세요. Vercel 프로젝트에 AI_GATEWAY_API_KEY를 등록한 뒤 다시 배포하면 됩니다.' }, 503);
    }
    if (status === 402) return reply({ error: 'AI Gateway의 사용 가능한 크레딧을 확인해 주세요.' }, 503);
    if (status === 429) return reply({ error: '요청이 많습니다. 잠시 후 다시 시도해 주세요.' }, 429);
    return reply({ error: '평가 요청에 실패했습니다. 잠시 후 다시 시도해 주세요. 계속되면 Vercel 로그를 확인해 주세요.' }, 502);
  }
}
