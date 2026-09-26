# Jev 평가실

한국어 입력 화면에서 내용을 입력하고, 직접 정한 예·아니요 질문을 Jev로 평가합니다.

- 모델: `typesafe-ai/jev`
- 호출: `ai` 패키지의 `experimental_evaluate`
- 결과: boolean 질문의 `probability` (P(true))
- Next.js App Router, 서버 전용 평가 호출. 데이터베이스와 평가 기록 저장 기능은 없습니다.

## Vercel 배포

Vercel에서 **Add New → Project → project4jev → Import → Deploy**를 선택합니다. Framework Preset은 Next.js입니다.
Vercel의 OIDC 인증을 사용할 수 있습니다. 인증 오류가 발생하면 프로젝트 Settings → Environment Variables에 `AI_GATEWAY_API_KEY`를 등록하고 재배포하세요. 실제 키를 GitHub에 올리지 마세요.
개인용 앱이면 Vercel Deployment Protection을 유지하고, 공개 사용 시 인증 및 영속적인 요청량 제한을 추가하세요.

## 개발

Node.js 22 이상에서 `npm ci`, `npm run dev`를 실행합니다. 로컬에서는 `.env.example`을 `.env.local`로 복사하고 키를 넣습니다.
검증: `npm run typecheck`, `npm run build`.

이 앱은 단일 boolean 평가 기능을 제공합니다. Jev는 생성형 채팅 모델이 아니므로 장문 설명을 생성하지 않습니다. 확률을 자동으로 법령 위반 판단 등으로 바꾸지 않습니다.
