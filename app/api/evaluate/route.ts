import { experimental_evaluate as evaluate } from 'ai';
import { parseEvaluation, publicFailure } from '../../../lib/evaluation';
export const runtime = 'nodejs';
export const maxDuration = 60;
const reply = (data: unknown, status = 200) => Response.json(data, {status, headers:{'Cache-Control':'no-store'}});
export async function POST(request: Request) {
  let input: ReturnType<typeof parseEvaluation>;
  try { input = parseEvaluation(await request.json()); }
  catch (e) { return reply({error: e instanceof SyntaxError ? '입력 형식이 올바르지 않습니다.' : e instanceof Error ? e.message : '입력을 확인해 주세요.'},400); }
  try {
    const result = await evaluate({model:'typesafe-ai/jev',state:input.state,questions:{assessment:input.question},abortSignal:AbortSignal.timeout(45000),maxRetries:1});
    return reply({answer:result.answers.assessment,labels:input.labels,question:input.question.instructions});
  } catch (error) {
    const failure = publicFailure(error, Boolean(process.env.AI_GATEWAY_API_KEY?.trim()));
    // Never expose prompts, tokens, response bodies, or upstream error messages.
    console.error('Jev evaluation failed', {code:failure.code});
    return reply({error:failure.error,code:failure.code},failure.status);
  }
}
