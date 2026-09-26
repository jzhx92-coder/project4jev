'use client';
import { useState, type FormEvent } from 'react';
import type { Mode, Answer } from '../lib/evaluation';
type Result = {answer: Answer; labels: string[]; question: string};
const modes: {id:Mode;title:string;description:string}[] = [{id:'boolean',title:'예 · 아니요',description:'질문에 동의하는 확률'},{id:'choice',title:'선택지 비교',description:'여러 선택지 중 하나'},{id:'score',title:'점수 평가',description:'직접 정한 기준으로 점수'}];
export default function Home() {
  const [mode,setMode] = useState<Mode>('boolean');
  const [state,setState] = useState('');
  const [question,setQuestion] = useState('');
  const [choices,setChoices] = useState(['','']);
  const [levels,setLevels] = useState(['전혀 해당하지 않음','조금 해당함','보통','많이 해당함','매우 해당함']);
  const [result,setResult] = useState<Result|null>(null);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState('');
  const options = mode === 'choice' ? choices : levels;
  function change() {setResult(null);setError('');}
  function changeMode(value:Mode) {setMode(value);change();}
  function updateOptions(value:string[]) {if(mode==='choice') setChoices(value);else setLevels(value);change();}
  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();if(loading)return;setLoading(true);change();
    try {
      const res=await fetch('/api/evaluate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode,state,question,options}),signal:AbortSignal.timeout(55000)});
      const data=await res.json();
      if(!res.ok)throw new Error(data.error||'평가에 실패했습니다.');
      if(!data.answer || data.answer.type !== mode)throw new Error('평가 결과 형식을 확인할 수 없습니다.');
      setResult(data);
    }catch(err){setError(err instanceof Error && err.name==='TimeoutError'?'응답이 늦어지고 있어요. 잠시 후 다시 시도해 주세요.':err instanceof Error?err.message:'평가에 실패했습니다.');}
    finally{setLoading(false);}
  }
  const answer=result?.answer;
  return <main>
    <nav><span className="brand"><span className="mark">J</span> Jev 플레이그라운드</span><span className="badge">typesafe-ai/jev</span></nav>
    <header><p className="eyebrow">직접 써보는 Jev</p><h1>궁금한 상황을 넣고,<br/><span>원하는 방식으로 평가하세요.</span></h1><p className="intro">주제는 자유롭게. 내용과 질문을 입력하고 결과를 확인해 보세요.</p></header>
    <div className="workspace"><form onSubmit={submit} className="card">
      <fieldset className="mode-group" disabled={loading}><legend>평가 방식</legend><div className="modes">{modes.map(m=><button key={m.id} type="button" aria-pressed={mode===m.id} className={mode===m.id?'mode active':'mode'} onClick={()=>changeMode(m.id)}><strong>{m.title}</strong><small>{m.description}</small></button>)}</div></fieldset>
      <label htmlFor="state">01 <strong>평가할 내용 · 상황</strong></label><textarea id="state" rows={7} maxLength={12000} value={state} onChange={e=>{setState(e.target.value);change();}} placeholder="상황, 생각, 글, 비교할 대상 등 원하는 내용을 자유롭게 입력하세요." required disabled={loading}/><p className="count">{state.length.toLocaleString()} / 12,000자</p>
      <label htmlFor="question">02 <strong>Jev에게 물어볼 질문</strong></label><textarea id="question" rows={2} maxLength={1000} value={question} onChange={e=>{setQuestion(e.target.value);change();}} placeholder={mode==='boolean'?'예·아니요로 판단할 질문을 입력하세요.':mode==='choice'?'어떤 기준으로 선택지를 비교할지 입력하세요.':'무엇을 평가할지 입력하세요.'} required disabled={loading}/>
      {mode!=='boolean'&&<fieldset className="options" disabled={loading}><legend>{mode==='choice'?'03 선택지':'03 점수별 기준'}</legend>{mode==='score'&&<p className="hint">낮은 점수부터 높은 점수 순서로 기준을 적어 주세요. 기준과 점수 범위는 자유롭게 바꿀 수 있어요.</p>}{options.map((value,i)=><div className="option-row" key={i}><label htmlFor={`option-${i}`}>{mode==='score'?`${i}점`:String.fromCharCode(65+i)}</label><input id={`option-${i}`} value={value} maxLength={300} placeholder={mode==='choice'?'선택지와 설명':'이 점수의 기준'} required onChange={e=>updateOptions(options.map((x,j)=>j===i?e.target.value:x))}/><button type="button" className="remove" aria-label={`${i+1}번째 항목 삭제`} disabled={options.length<=2} onClick={()=>updateOptions(options.filter((_,j)=>j!==i))}>×</button></div>)}<button className="example" type="button" disabled={options.length>=8} onClick={()=>updateOptions([...options,''])}>+ {mode==='choice'?'선택지':'점수 기준'} 추가</button></fieldset>}
      <button type="submit" className="submit" disabled={loading||!state.trim()||!question.trim()||(mode!=='boolean'&&options.some(x=>!x.trim()))}>{loading?'Jev가 평가하고 있어요…':'Jev로 평가하기'}<span aria-hidden="true">→</span></button>{error&&<p className="error" role="alert">{error}</p>}
    </form><aside className="card result" aria-live="polite" aria-busy={loading}><p className="eyebrow">평가 결과</p>
      {result&&answer?<><h2>{answer.type==='boolean'?'‘예’라고 평가한 확률':answer.type==='choice'?'Jev가 선택한 항목':'Jev의 평가 점수'}</h2>
      {answer.type==='boolean'?<><p className="probability">{(answer.probability*100).toFixed(1)}<small>%</small></p><progress value={answer.probability} max={1} aria-label="예라고 평가한 확률"/><div className="split"><span>예 {(answer.probability*100).toFixed(1)}%</span><span>아니요 {((1-answer.probability)*100).toFixed(1)}%</span></div></>:answer.type==='choice'?<p className="selected">{result.labels[Number(answer.choice.replace('option_',''))]??answer.choice}</p>:<><p className="probability">{answer.score.toFixed(2)}<small> / {result.labels.length-1}</small></p><progress value={answer.score} max={result.labels.length-1} aria-label="평가 점수"/></>}
      {answer.type!=='boolean'&&answer.probabilities&&<div className="distribution">{result.labels.map((label,i)=>{const p=answer.probabilities?.[answer.type==='choice'?`option_${i}`:String(i)];return typeof p==='number'?<div key={i}><div className="split"><span>{answer.type==='score'?`${i}점 · `:''}{label}</span><strong>{(p*100).toFixed(1)}%</strong></div><progress value={p} max={1} aria-label={`${label} 확률`}/></div>:null;})}</div>}
      <p className="question">{result.question}</p><p className="hint">입력한 내용과 기준에 대한 모델의 평가입니다.</p><details><summary>원본 결과 보기</summary><pre>{JSON.stringify(answer,null,2)}</pre></details></>:<div className="empty"><span className="result-icon" aria-hidden="true">◎</span><h2>{loading?'평가 중입니다':'어떤 것이든 시작해 보세요'}</h2><p>{loading?'잠시만 기다려 주세요.':'내용과 질문을 입력하면\nJev의 평가가 여기에 나타나요.'}</p></div>}
      <div className="note"><strong>내 기준으로 자유롭게</strong><p>예·아니요로 판단하거나, 선택지를 비교하거나, 점수를 매길 수 있어요. 선택지와 점수 기준도 직접 정해 보세요.</p></div>
    </aside></div><footer>입력 내용은 평가를 위해 Vercel AI Gateway와 모델 제공자에게 전송됩니다.</footer>
  </main>;
}
