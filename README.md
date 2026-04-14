# StackPulse

StackPulse는 개발자에게 필요한 최신 기술 이슈를 AI가 수집하고,  
`요약 + 해석 + 영향도 분석 + 액션 제안`까지 제공하는 개발자용 기술 의사결정 지원 서비스입니다.

이 프로젝트는 단순한 기술 뉴스 요약 앱이 아닙니다.  
핵심은 “무슨 소식이 나왔는가”를 전달하는 것이 아니라, “그래서 이게 내 기술 스택과 실무에 어떤 의미가 있는가”를 빠르게 판단하게 돕는 데 있습니다.

## 🚀 제품 소개

개발자는 최신 기술 흐름을 놓치고 싶지 않지만, 실제로는 다음 문제가 반복됩니다.

- 정보가 너무 많아 무엇이 중요한지 구분하기 어렵다
- 같은 이슈가 여러 기사와 포스트로 중복 노출된다
- 내 기술 스택과 관련 있는지 빠르게 판단하기 어렵다
- 단순 요약만으로는 실무 대응 여부를 결정하기 어렵다

StackPulse는 이 문제를 해결하기 위해 기술 소식을 `기사 단위`가 아니라 `이슈 단위`로 묶고,  
AI가 개발자 관점에서 해석해 실제 의사결정에 필요한 정보를 제공합니다.

## 🧠 핵심 컨셉

StackPulse의 정보 구조는 아래 3 Layer를 중심으로 설계됩니다.

1. `Original`
영문 원문 제목과 소스를 유지합니다. Source of Truth 역할입니다.

2. `Summary`
사용자 언어로 핵심 내용을 빠르게 파악할 수 있게 요약합니다.

3. `Interpretation`
가장 중요한 레이어입니다.  
개발자 관점에서 “이 변화가 왜 중요한지”, “누가 영향을 받는지”, “지금 무엇을 해야 하는지”를 설명합니다.

추가로 아래 두 레이어가 함께 붙습니다.

- `Impact`: 영향도와 대상 사용자
- `Action`: 지금 해야 할 일, 나중에 봐도 되는 일, 무시 가능한 일

즉, StackPulse는 번역 서비스가 아니라 `이해 + 판단 지원` 서비스입니다.

## 📝 예시

```text
[Original]
Next.js 16.2 released

[Summary - Korean]
Next.js 16.2가 출시되었습니다

[Interpretation]
- App Router 성능 개선
- Turbopack 안정성 증가
- 기존 운영 프로젝트는 긴급 대응 필요성 낮음

[Action]
- 바로 업데이트 필요 없음
- changelog 확인 권장
```

## 📱 현재 MVP 범위

이 저장소에는 모바일 MVP 기준의 앱과 로컬 API 서버가 함께 포함되어 있습니다.

- 온보딩
  - 역할 선택
  - 관심 기술 스택 선택
  - 앱 언어 선택
  - 푸시 강도 선택
- 홈 피드
  - 이슈 카드 기반 피드
  - 중요도 배지
  - 제목 + 핵심 한 줄 중심의 브리핑 카드
  - pull-to-refresh
- 이슈 상세
  - Interpretation 중심 상세 구조
  - 영향도 / 액션 / 소스 확인
- 저장 기능
- 알림 화면
- 설정 화면
- 로컬 API 서버
  - `GET /api/feed?stacks=...`
  - `GET /api/issues/:id`
  - `POST /api/refresh`

현재는 `앱 -> 로컬 API -> 콘텐츠 파이프라인 산출물` 구조로 핵심 UX를 검증할 수 있는 상태입니다.
앱은 더 이상 번들 seed 데이터를 기본 이슈 목록으로 사용하지 않고, 서버에서 스택별 최신 이슈 목록을 조회합니다.

## 👥 타겟 사용자

1차 타겟:

- 프론트엔드 개발자
- React / Next.js / TypeScript 사용자

2차 타겟:

- 풀스택 개발자
- 테크 리드

## ✨ 차별점

- 단순 뉴스 큐레이션이 아니라 `기술 판단 보조`에 초점을 둡니다
- 기사 단위가 아니라 `이슈 단위`로 정보를 묶습니다
- 원문은 영어로 유지하고, 요약/해석/액션은 사용자 언어로 제공합니다
- 개인의 기술 스택을 기준으로 우선순위를 조정합니다
- 중요한 이슈는 푸시 알림 중심으로 전달합니다

## 🌍 다국어 전략

StackPulse는 글로벌 개발자를 대상으로 하며, 다국어 UX를 제품 구조에 포함합니다.

- 원문은 항상 영어 유지
- 요약 / 해석 / 액션은 사용자 언어로 제공
- EN / KR UI 지원
- 현재 MVP는 앱 언어 기준으로 콘텐츠 표시 언어를 결정
  - 한국어 UI: 한국어 제목/요약/해석
  - 영어 UI: 영어 제목/요약/해석

핵심은 “번역”이 아니라 “영문 원문 기반의 신뢰 유지 + 현지어 기반의 판단 지원”입니다.

## 🛠 기술 스택

- Expo
- React Native
- TypeScript
- Node.js API 서버
- SQLite (현재 개발/검증용 저장소)
- Postgres 전환 준비 구조

## ▶️ 실행 방법

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 실행

가장 권장되는 방식은 앱과 로컬 API 서버를 함께 켜는 것입니다.

```bash
npm run dev
```

개별 실행이 필요하면 아래처럼 나눠서 실행할 수 있습니다.

```bash
npm start
npm run server:start
```

운영형 백엔드 테스트를 준비하려면 아래 환경변수도 사용할 수 있습니다.

```bash
DATABASE_URL=postgresql://stackpulse:password@localhost:5432/stackpulse
STACK_PULSE_DB_SSL=false
```

필요하면 아래 명령도 사용할 수 있습니다.

```bash
npm run ios
npm run android
```

### 3. 타입 체크

```bash
npm run typecheck
```

### 4. 콘텐츠 파이프라인 실행

```bash
npm run content:fetch
npm run content:enrich
npm run content:build
```

`content:fetch`는 공식 소스 fetcher를 우선 시도하고, 실패 시 fixture 스냅샷으로 fallback해  
`content/fetched-sources.json`을 생성합니다.  
`content:enrich`는 AI 생성 모드를 붙일 수 있는 enrichment 단계이며, 현재는 baseline fallback을 기본으로 사용합니다.  
`content:build`는 이를 바탕으로 해석/액션 데이터를 결합해 서버가 읽는 `content/app-content.json`과 개발용 산출물을 생성합니다.

한 번에 순차 실행하려면 아래 명령을 사용할 수 있습니다.

```bash
npm run content:refresh
```

## 📂 프로젝트 구조

```text
components/   화면 및 UI 컴포넌트
constants/    테마 상수
content/      원문 수집 데이터, fixture, 해석 템플릿
data/         앱 소비용 생성 데이터
hooks/        앱 상태 훅
lib/          포맷팅 및 공통 로직
server/       로컬 API 서버
scripts/      콘텐츠 수집 및 생성 스크립트
types/        타입 정의
App.tsx       앱 엔트리
```

## 🔄 현재 데이터 흐름

현재 개발 기준 데이터 흐름은 아래와 같습니다.

1. `content:fetch`
   공식 소스 fetch 시도, 실패 시 fixture fallback
2. `content:enrich`
   이슈별 summary / interpretation / action 생성
3. `content:build`
   `content/app-content.json` 생성
4. `content:sync-db`
   현재 DB 저장소에 이슈/소스/클러스터 데이터 적재
5. `server/index.mjs`
   DB 기준으로 스택별 최신 이슈를 API로 제공
5. 앱
   선택한 스택 기준으로 `/api/feed?stacks=...` 조회

즉 현재 앱은 콘텐츠 자체를 로컬에 저장해두고 보여주지 않고, API 기준으로 최신 목록을 다시 조회합니다.
로컬에 저장되는 것은 `read / saved / notified / onboarding 설정` 같은 사용자 상태뿐입니다.

## 📦 배포 준비 상태

- `app.config.ts` 기반으로 앱 설정을 환경변수로 관리
- `eas.json`으로 development / preview / production 빌드 프로필 분리
- 앱 안에 문의 메일, 저작권, 정책 링크 진입점 포함
- 광고 도입을 고려해 추적 설명 문구와 광고 on/off 환경값 준비

정책 초안:

- [Privacy Policy](https://github.com/SAEMMM/stack-pulse/blob/main/docs/privacy-policy.md)
- [Terms of Service](https://github.com/SAEMMM/stack-pulse/blob/main/docs/terms-of-service.md)

## ⚠️ 현재 한계

- 서버 저장소는 아직 SQLite 기준이며 운영용 Postgres 전환이 남아 있습니다
- 서버는 `DATABASE_URL`이 있으면 Postgres를, 없으면 SQLite를 사용합니다
- 현재 refresh는 로컬 콘텐츠 파이프라인을 다시 실행하는 개발용 구조입니다
- 공식 소스 수집은 가능하지만, 기본 검증은 fixture 기반으로 돌아갑니다
- 앱스토어 배포 전 실제 privacy / terms / support URL을 운영 도메인으로 교체해야 합니다
- 진짜 운영 단계에서는 Postgres, 백엔드 배치/크론, 호스팅된 HTTPS API가 필요합니다

## 🧭 다음 단계

다음 구현 우선순위는 아래와 같습니다.

1. Postgres 기반 운영 DB 전환
2. 수집 파이프라인을 서버 쪽 배치/잡으로 이동
3. 공식 소스 live fetch를 기본 경로로 전환
4. AI 기반 Summary / Interpretation / Action 생성 품질 고도화
5. 광고 SDK 연동 전 privacy / tracking / placement 정책 확정
6. 사용자별 상태를 서버와 동기화

## 📌 제품 원칙

- 원문은 신뢰 장치다
- 해석은 핵심 가치다
- 화제성보다 실무 영향도가 중요하다
- 사용자는 뉴스를 읽는 것이 아니라 결정을 내리러 온다

---

StackPulse는 개발자가 기술 소식을 “소비”하는 시간을 줄이고,  
그 소식이 자신의 코드베이스와 팀 운영에 어떤 의미가 있는지 더 빨리 판단하게 만드는 것을 목표로 합니다.
