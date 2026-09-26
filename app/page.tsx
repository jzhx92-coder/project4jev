'use client';
import { useState, type FormEvent } from 'react';

type Result = { probability: number; question: string };
export default function Home() {
  const [state, setState] = useState('');
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  function example() {
    setState('사용 후기: 사용법이 간단하고 필요한 기능을 쉽게 찾을 수 있어서 만족해요.');
    setQuestion('이 사용 후기는 긍정적인가?');
    setResult(null); setError('');
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const response = await fetch('/api/evaluate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state, question }), signal: AbortSignal.timeout(55000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '평가에 실패했습니다.');
      if (typeof data.probability !== 'number' || !Number.isFinite(data.probability) || data.probability < 0 || data.probability > 1) throw new Error('평가 결과 형식을 확인할 수 없습니다.');
      setResult({ probability: data.probability, question: data.question });
    } catch (err) { setError(err instanceof Error && err.name === 'TimeoutError' ? '응답 시간이 길어지고 있습니다. 잠시 후 다시 시도해 주세요.' : err instanceof Error ? err.message : '평가에 실패했습니다.'); }
    finally { setLoading(false); }
  }
  return <main>
    <nav><span className="brand"><span className="mark">J</span> Jev 평가실</span><span className="badge">Evaluation model</span></nav>
    <header><p className="eyebrow">작은 질문, 명확한 평가</p><h1>내용을 읽고,<br/><span>판단의 기준을 확인하세요.</span></h1><p className="intro">평가할 내용과 예·아니요로 답할 질문을 입력하세요.<br/>Jev가 ‘예’라고 평가하는 확률을 보여줍니다.</p></header>
    <div className="workspace"><form onSubmit={submit} className="card">
      <div className="card-heading"><h2>평가 입력</h2><button type="button" className="example" onClick={example} disabled={loading}>예시 넣기 ↗</button></div>
      <label htmlFor="state">01 <strong>평가할 내용</strong></label>
      <textarea id="state" value={state} onChange={e => { setState(e.target.value); setResult(null); }} maxLength={12000} rows={9} placeholder="사례, 문서의 일부 또는 검토할 내용을 붙여넣으세요." required disabled={loading}/>
      <p className="count">{state.length.toLocaleString()} / 12,000자</p>
      <label htmlFor="question">02 <strong>평가 질문</strong></label>
      <textarea id="question" value={question} onChange={e => { setQuestion(e.target.value); setResult(null); }} maxLength={1000} rows={2} placeholder="평가하고 싶은 질문을 직접 입력하세요." required disabled={loading}/>
      <p className="hint">예: 이 답변은 제시된 자료에 근거하고 있는가?</p>
      <button className="submit" disabled={loading || !state.trim() || !question.trim()} type="submit">{loading ? 'Jev가 평가하고 있어요…' : 'Jev로 평가하기'} <span aria-hidden="true">→</span></button>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
    <aside className="card result" aria-live="polite" aria-busy={loading}><p className="eyebrow">평가 결과</p>
      {result ? <><h2>‘예’라고 평가한 확률</h2><p className="probability">{(result.probability * 100).toFixed(1)}<small>%</small></p><progress value={result.probability} max={1} aria-label="예라고 평가한 확률"/><p className="question">{result.question}</p><p className="hint">모델의 평가 확률입니다. 결과의 정확성을 보장하는 수치는 아닙니다.</p></> : <div className="empty"><span className="result-icon" aria-hidden="true">◎</span><h2>{loading ? '평가 중입니다' : '새로운 판단의 시작'}</h2><p>{loading ? '잠시만 기다려 주세요.' : '왼쪽에 내용을 입력하면 평가 결과가 여기에 나타나요.'}</p></div>}
      <div className="note"><strong>처음이라면 예시부터</strong><p>예시 넣기를 누르면 간단한 사용 후기로 시험해 볼 수 있어요. 질문은 원하는 기준으로 바꿀 수 있습니다.</p></div>
    </aside></div><footer>입력 내용은 평가를 위해 Vercel AI Gateway와 모델 제공자에게 전송됩니다. 개인정보·비공개 자료는 제외해 주세요.</footer>
  </main>;
}
