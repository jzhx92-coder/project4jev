# Jev 평가실

원하는 내용과 질문을 입력하고 예·아니요, 선택지 비교, 점수 평가 중 원하는 방식으로 Jev를 사용합니다.

- 모델: `typesafe-ai/jev`
- 호출: `ai` 패키지의 `experimental_evaluate`
- 결과: boolean의 확률, choice의 선택 항목, score의 점수와 제공된 확률 분포
- Next.js App Router, 서버 전용 평가 호출. 데이터베이스와 평가 기록 저장 기능은 없습니다.

## Vercel 배포

Vercel에서 **Add New → Project → project4jev → Import → Deploy**를 선택합니다. Framework Preset은 Next.js입니다.
Vercel의 OIDC 인증을 사용할 수 있습니다. 인증 오류가 발생하면 프로젝트 Settings → Environment Variables에 `AI_GATEWAY_API_KEY`를 등록하고 재배포하세요. 실제 키를 GitHub에 올리지 마세요.
개인용 앱이면 Vercel Deployment Protection을 유지하고, 공개 사용 시 인증 및 영속적인 요청량 제한을 추가하세요.

## 개발

Node.js 22 이상에서 `npm ci`, `npm run dev`를 실행합니다. 로컬에서는 `.env.example`을 `.env.local`로 복사하고 키를 넣습니다.
검증: `npm run typecheck`, `npm run build`.

선택지와 점수 기준을 2~8개 설정할 수 있습니다. 점수는 0부터 시작하며, SDK가 반환한 점수를 그대로 표시합니다. Jev 자체를 사용하며 다른 모델로 전환하지 않습니다.
