import { ContentMeta, Issue } from "../types/app";

export const generatedIssues: Issue[] = [
  {
    "id": "typescript-vuln",
    "severity": "security",
    "tags": [
      "TypeScript",
      "Node.js"
    ],
    "cluster": {
      "sourceTypes": [
        "security"
      ],
      "sourceCount": 1,
      "officialSourceCount": 1,
      "firstSeenAt": "2026-04-13T02:30:00Z",
      "lastUpdatedAt": "2026-04-13T02:30:00Z"
    },
    "originalTitle": "TypeScript ecosystem package disclosed a supply-chain vulnerability",
    "title": {
      "en": "Supply-chain risk hits a TypeScript-adjacent package",
      "ko": "TypeScript 인접 패키지 공급망 취약점, CI 점검 필요"
    },
    "summary": {
      "en": "A supply-chain vulnerability affecting a TypeScript-adjacent package has been disclosed.",
      "ko": "TypeScript 생태계 인접 패키지에서 공급망 취약점이 공개되었습니다."
    },
    "interpretation": {
      "en": [
        "This matters if your build pipeline directly depends on the affected package.",
        "Impact is higher for CI environments and shared internal templates."
      ],
      "ko": [
        "영향 여부는 TypeScript 사용 자체보다, 해당 패키지가 빌드 파이프라인에 포함됐는지가 핵심입니다.",
        "특히 CI 환경과 사내 템플릿을 공유하는 조직에서 영향 가능성이 큽니다."
      ]
    },
    "action": {
      "en": [
        "Audit dependency trees in CI today.",
        "Patch or isolate affected environments immediately."
      ],
      "ko": [
        "오늘 바로 CI 의존성 트리를 점검하세요.",
        "영향 환경이 확인되면 즉시 패치 또는 격리를 진행하세요."
      ]
    },
    "impact": {
      "level": "high",
      "audience": [
        "Frontend teams",
        "Platform owners",
        "Tech leads"
      ],
      "reason": {
        "en": "Security posture and CI integrity can be affected immediately.",
        "ko": "보안 상태와 CI 무결성에 즉시 영향을 줄 수 있는 유형입니다."
      }
    },
    "sourceCount": 1,
    "sources": [
      {
        "title": "GitHub Advisory",
        "url": "https://github.com/advisories",
        "type": "security",
        "host": "github.com",
        "isOfficial": true,
        "publishedAt": "2026-04-13T02:30:00Z"
      }
    ],
    "publishedAt": "2026-04-13T02:30:00Z",
    "readTime": "2 min"
  },
  {
    "id": "next-16-2",
    "severity": "major",
    "tags": [
      "Next.js",
      "React",
      "Vercel"
    ],
    "cluster": {
      "sourceTypes": [
        "blog",
        "release_note"
      ],
      "sourceCount": 2,
      "officialSourceCount": 2,
      "firstSeenAt": "2026-04-12T08:00:00Z",
      "lastUpdatedAt": "2026-04-12T10:00:00Z"
    },
    "originalTitle": "Next.js 16.2 released",
    "title": {
      "en": "Next.js 16.2 sharpens App Router performance",
      "ko": "Next.js 16.2, App Router 성능 개선 폭 커졌다"
    },
    "summary": {
      "en": "Next.js 16.2 adds practical performance wins for App Router teams.",
      "ko": "Next.js 16.2는 App Router 팀에 실질적인 성능 개선을 제공합니다."
    },
    "interpretation": {
      "en": [
        "Most existing teams can treat this as a planned review item rather than an urgent task.",
        "App Router performance got practical improvements for production workloads.",
        "Turbopack stability is improving, but this is not a forced migration moment."
      ],
      "ko": [
        "대부분의 팀은 긴급 대응보다 정기 업그레이드 검토 항목으로 보면 됩니다.",
        "App Router 기준으로 실무 체감이 가능한 성능 개선이 포함됐습니다.",
        "Turbopack 안정성이 높아졌지만, 지금 당장 마이그레이션을 강제하는 수준은 아닙니다."
      ]
    },
    "action": {
      "en": [
        "Evaluate for new projects first.",
        "Review the changelog before the next sprint."
      ],
      "ko": [
        "신규 프로젝트에서 우선 검토하는 접근이 적절합니다.",
        "다음 스프린트 전에 changelog를 확인하세요."
      ]
    },
    "impact": {
      "level": "medium",
      "audience": [
        "Next.js users",
        "App Router teams"
      ],
      "reason": {
        "en": "Relevant for teams already using Next.js, but not a same-day action item.",
        "ko": "Next.js 운영 팀에는 관련성이 높지만, 당일 대응이 필요한 수준은 아닙니다."
      }
    },
    "sourceCount": 2,
    "sources": [
      {
        "title": "Vercel Blog",
        "url": "https://vercel.com/blog",
        "type": "blog",
        "host": "vercel.com",
        "isOfficial": true,
        "publishedAt": "2026-04-12T10:00:00Z"
      },
      {
        "title": "Next.js Release Notes",
        "url": "https://nextjs.org",
        "type": "release_note",
        "host": "nextjs.org",
        "isOfficial": true,
        "publishedAt": "2026-04-12T08:00:00Z"
      }
    ],
    "publishedAt": "2026-04-12T10:00:00Z",
    "readTime": "3 min"
  },
  {
    "id": "react-compiler-rfc",
    "severity": "breaking",
    "tags": [
      "React"
    ],
    "cluster": {
      "sourceTypes": [
        "blog",
        "rfc"
      ],
      "sourceCount": 2,
      "officialSourceCount": 2,
      "firstSeenAt": "2026-04-11T11:15:00Z",
      "lastUpdatedAt": "2026-04-11T12:00:00Z"
    },
    "originalTitle": "Compiler guidance updated for React teams",
    "title": {
      "en": "React Compiler tightens escape hatch expectations",
      "ko": "React Compiler 규칙 강화, 기존 패턴 재점검 필요"
    },
    "summary": {
      "en": "The React Compiler RFC was updated with stricter patterns around escape hatches.",
      "ko": "React Compiler RFC가 escape hatch 사용 조건을 더 엄격하게 조정했습니다."
    },
    "interpretation": {
      "en": [
        "This is not production breakage today, but it changes future coding conventions.",
        "Teams experimenting with compiler adoption should revisit custom hook and memoization patterns."
      ],
      "ko": [
        "오늘 배포가 깨지는 이슈는 아니지만, 앞으로의 React 코딩 규칙에는 영향을 줍니다.",
        "컴파일러 도입을 검토 중인 팀은 custom hook, memoization 패턴을 다시 봐야 합니다."
      ]
    },
    "action": {
      "en": [
        "Track the RFC before adopting new lint rules.",
        "Do not refactor production code yet without validation."
      ],
      "ko": [
        "새 lint rule을 강제하기 전에 RFC 변화를 추적하세요.",
        "검증 없이 운영 코드를 선제 리팩터링할 필요는 없습니다."
      ]
    },
    "impact": {
      "level": "medium",
      "audience": [
        "React teams",
        "Tech leads"
      ],
      "reason": {
        "en": "It affects code standards and adoption timing more than runtime behavior.",
        "ko": "런타임보다 코드 표준과 도입 시점 판단에 영향을 주는 이슈입니다."
      }
    },
    "sourceCount": 2,
    "sources": [
      {
        "title": "React Blog",
        "url": "https://react.dev/blog",
        "type": "blog",
        "host": "react.dev",
        "isOfficial": true,
        "publishedAt": "2026-04-11T12:00:00Z"
      },
      {
        "title": "React RFC",
        "url": "https://github.com/reactjs",
        "type": "rfc",
        "host": "github.com",
        "isOfficial": true,
        "publishedAt": "2026-04-11T11:15:00Z"
      }
    ],
    "publishedAt": "2026-04-11T12:00:00Z",
    "readTime": "2 min"
  },
  {
    "id": "typescript-release",
    "severity": "major",
    "tags": [
      "TypeScript",
      "Node.js"
    ],
    "cluster": {
      "sourceTypes": [
        "release_note"
      ],
      "sourceCount": 1,
      "officialSourceCount": 1,
      "firstSeenAt": "2026-04-10T09:10:00Z",
      "lastUpdatedAt": "2026-04-10T09:10:00Z"
    },
    "originalTitle": "TypeScript 5.9 beta released",
    "title": {
      "en": "TypeScript beta raises review points for large repos",
      "ko": "TypeScript 베타 공개, 대규모 저장소는 타입 체크 변화 점검 필요"
    },
    "summary": {
      "en": "A new TypeScript beta introduces compiler and language service changes worth tracking.",
      "ko": "새 TypeScript 베타에 컴파일러와 언어 서비스 관련 변화가 포함됐습니다."
    },
    "interpretation": {
      "en": [
        "This is more relevant for teams with large monorepos than for small apps.",
        "Editor behavior and compile performance can shift before production semantics do."
      ],
      "ko": [
        "작은 앱보다 대형 모노레포나 타입 의존도가 높은 팀에서 먼저 체감할 가능성이 큽니다.",
        "런타임보다 에디터 경험과 컴파일 체감이 먼저 달라질 수 있습니다."
      ]
    },
    "action": {
      "en": [
        "Test the beta in CI on a branch first.",
        "Check plugin and ESLint compatibility before broader rollout."
      ],
      "ko": [
        "운영 반영 전, 브랜치에서 CI 기준으로 먼저 검증하세요.",
        "확대 적용 전에 플러그인과 ESLint 호환성을 확인하세요."
      ]
    },
    "impact": {
      "level": "medium",
      "audience": [
        "Frontend teams",
        "Fullstack teams"
      ],
      "reason": {
        "en": "Type-heavy codebases can see workflow changes even when runtime behavior stays stable.",
        "ko": "런타임 변화는 작더라도 타입 중심 코드베이스에서는 워크플로우 변화가 클 수 있습니다."
      }
    },
    "sourceCount": 1,
    "sources": [
      {
        "title": "TypeScript GitHub Releases",
        "url": "https://github.com/microsoft/TypeScript/releases",
        "type": "release_note",
        "host": "github.com",
        "isOfficial": true,
        "publishedAt": "2026-04-10T09:10:00Z"
      }
    ],
    "publishedAt": "2026-04-10T09:10:00Z",
    "readTime": "2 min"
  },
  {
    "id": "node-runtime-release",
    "severity": "major",
    "tags": [
      "Node.js",
      "Backend"
    ],
    "cluster": {
      "sourceTypes": [
        "blog"
      ],
      "sourceCount": 1,
      "officialSourceCount": 1,
      "firstSeenAt": "2026-04-09T04:20:00Z",
      "lastUpdatedAt": "2026-04-09T04:20:00Z"
    },
    "originalTitle": "Node.js runtime release improves startup and package tooling",
    "title": {
      "en": "Node.js runtime update is worth a backend baseline check",
      "ko": "Node.js 런타임 업데이트, 백엔드 기본 환경 점검 가치 높다"
    },
    "summary": {
      "en": "The latest Node.js runtime update touches startup and package tooling behavior.",
      "ko": "최신 Node.js 런타임 업데이트가 시작 속도와 패키지 툴링 동작에 영향을 줍니다."
    },
    "interpretation": {
      "en": [
        "This is not just another version bump if your API servers or workers are containerized.",
        "Differences in startup and tooling behavior can surface first in CI and deploy pipelines."
      ],
      "ko": [
        "API 서버나 워커를 컨테이너로 운영한다면 단순 버전 업데이트로 보면 안 됩니다.",
        "시작 속도와 툴링 변화는 보통 서비스 코드보다 CI와 배포 파이프라인에서 먼저 드러납니다."
      ]
    },
    "action": {
      "en": [
        "Validate base images and package manager behavior before rolling forward.",
        "Benchmark cold starts on staging if startup matters for your services."
      ],
      "ko": [
        "업데이트 전 베이스 이미지와 패키지 매니저 동작부터 검증하세요.",
        "시작 속도가 중요한 서비스라면 스테이징에서 cold start를 확인하세요."
      ]
    },
    "impact": {
      "level": "medium",
      "audience": [
        "Backend teams",
        "Platform owners"
      ],
      "reason": {
        "en": "Backend runtime updates mainly affect deploy reliability and environment consistency.",
        "ko": "백엔드 런타임 업데이트는 기능보다 배포 안정성과 환경 일관성에 더 큰 영향을 줍니다."
      }
    },
    "sourceCount": 1,
    "sources": [
      {
        "title": "Node.js Blog",
        "url": "https://nodejs.org/en/blog",
        "type": "blog",
        "host": "nodejs.org",
        "isOfficial": true,
        "publishedAt": "2026-04-09T04:20:00Z"
      }
    ],
    "publishedAt": "2026-04-09T04:20:00Z",
    "readTime": "2 min"
  },
  {
    "id": "nestjs-auth-update",
    "severity": "major",
    "tags": [
      "NestJS",
      "Backend",
      "Node.js"
    ],
    "cluster": {
      "sourceTypes": [
        "release_note"
      ],
      "sourceCount": 1,
      "officialSourceCount": 1,
      "firstSeenAt": "2026-04-08T13:00:00Z",
      "lastUpdatedAt": "2026-04-08T13:00:00Z"
    },
    "originalTitle": "NestJS auth and guard workflow update released",
    "title": {
      "en": "NestJS auth changes could ripple into guard design",
      "ko": "NestJS 인증 흐름 변경, guard 설계 재점검 필요할 수 있다"
    },
    "summary": {
      "en": "A NestJS release updates auth and guard-related workflows for backend services.",
      "ko": "NestJS 릴리즈에 인증과 guard 관련 워크플로우 변경이 포함됐습니다."
    },
    "interpretation": {
      "en": [
        "This matters most for teams with shared auth modules or opinionated starter templates.",
        "Even small auth changes can spread widely if your service architecture reuses decorators and guards."
      ],
      "ko": [
        "공용 인증 모듈이나 사내 템플릿을 쓰는 팀이라면 영향 범위가 넓을 수 있습니다.",
        "NestJS에서는 작은 인증 변경도 decorator와 guard 재사용 구조 때문에 파급이 커질 수 있습니다."
      ]
    },
    "action": {
      "en": [
        "Review shared auth modules before upgrading multiple services.",
        "Test guard composition in one service before broad rollout."
      ],
      "ko": [
        "여러 서비스를 올리기 전에 공용 인증 모듈부터 검토하세요.",
        "전사 적용 전 한 서비스에서 guard 조합을 먼저 검증하세요."
      ]
    },
    "impact": {
      "level": "medium",
      "audience": [
        "Backend teams",
        "Tech leads"
      ],
      "reason": {
        "en": "Authentication changes often spread across service boundaries faster than other framework updates.",
        "ko": "인증 관련 변화는 다른 프레임워크 업데이트보다 서비스 경계를 더 빠르게 타고 퍼집니다."
      }
    },
    "sourceCount": 1,
    "sources": [
      {
        "title": "NestJS GitHub Releases",
        "url": "https://github.com/nestjs/nest/releases",
        "type": "release_note",
        "host": "github.com",
        "isOfficial": true,
        "publishedAt": "2026-04-08T13:00:00Z"
      }
    ],
    "publishedAt": "2026-04-08T13:00:00Z",
    "readTime": "2 min"
  },
  {
    "id": "prisma-query-engine",
    "severity": "major",
    "tags": [
      "Prisma",
      "Database",
      "Backend"
    ],
    "cluster": {
      "sourceTypes": [
        "release_note"
      ],
      "sourceCount": 1,
      "officialSourceCount": 1,
      "firstSeenAt": "2026-04-07T07:45:00Z",
      "lastUpdatedAt": "2026-04-07T07:45:00Z"
    },
    "originalTitle": "Prisma query engine and migrate updates released",
    "title": {
      "en": "Prisma query engine updates may affect CI consistency",
      "ko": "Prisma query engine 업데이트, CI 일관성에 영향 줄 수 있다"
    },
    "summary": {
      "en": "Prisma updated query engine and migrate behavior that backend teams should review.",
      "ko": "Prisma가 query engine과 migrate 동작을 업데이트했습니다."
    },
    "interpretation": {
      "en": [
        "This is relevant if your team relies on generated clients across multiple environments.",
        "Small differences in query engine and migrate behavior tend to show up first in CI and preview deployments."
      ],
      "ko": [
        "여러 환경에서 생성된 client를 공유한다면 특히 민감하게 봐야 하는 업데이트입니다.",
        "query engine과 migrate 변화는 로컬보다 CI와 preview 환경에서 먼저 드러나는 경우가 많습니다."
      ]
    },
    "action": {
      "en": [
        "Regenerate Prisma clients in CI and compare outputs before rollout.",
        "Check migration behavior in preview databases first."
      ],
      "ko": [
        "배포 전 CI에서 Prisma client를 다시 생성해 차이를 확인하세요.",
        "preview DB에서 migration 동작부터 점검하세요."
      ]
    },
    "impact": {
      "level": "medium",
      "audience": [
        "Backend teams",
        "Fullstack teams"
      ],
      "reason": {
        "en": "Database toolchain changes can affect development and deployment reliability even without schema changes.",
        "ko": "스키마 변경이 없어도 DB 툴체인 변화는 개발과 배포 안정성에 직접 영향을 줄 수 있습니다."
      }
    },
    "sourceCount": 1,
    "sources": [
      {
        "title": "Prisma GitHub Releases",
        "url": "https://github.com/prisma/prisma/releases",
        "type": "release_note",
        "host": "github.com",
        "isOfficial": true,
        "publishedAt": "2026-04-07T07:45:00Z"
      }
    ],
    "publishedAt": "2026-04-07T07:45:00Z",
    "readTime": "2 min"
  },
  {
    "id": "fastapi-security-update",
    "severity": "security",
    "tags": [
      "FastAPI",
      "Python",
      "Backend"
    ],
    "cluster": {
      "sourceTypes": [
        "security"
      ],
      "sourceCount": 1,
      "officialSourceCount": 1,
      "firstSeenAt": "2026-04-06T06:30:00Z",
      "lastUpdatedAt": "2026-04-06T06:30:00Z"
    },
    "originalTitle": "FastAPI security update addresses request validation edge case",
    "title": {
      "en": "FastAPI security patch deserves same-day backend review",
      "ko": "FastAPI 보안 패치, 백엔드 팀은 당일 검토 필요"
    },
    "summary": {
      "en": "A FastAPI release addresses a security-sensitive validation edge case.",
      "ko": "FastAPI 릴리즈가 보안 민감도가 높은 검증 edge case를 수정했습니다."
    },
    "interpretation": {
      "en": [
        "This is higher priority than a typical framework patch because request validation touches the perimeter.",
        "Public APIs and multi-tenant services should treat this as an urgent review item."
      ],
      "ko": [
        "요청 검증은 서비스 경계면에 가까워서 일반 패치보다 우선순위가 높습니다.",
        "외부 공개 API나 멀티테넌트 서비스라면 긴급 검토 항목으로 보는 게 맞습니다."
      ]
    },
    "action": {
      "en": [
        "Check whether affected validation paths are exposed publicly.",
        "Prioritize patch rollout for internet-facing services."
      ],
      "ko": [
        "영향받는 검증 경로가 외부 공개 API에 있는지 먼저 확인하세요.",
        "인터넷 노출 서비스부터 우선 패치하세요."
      ]
    },
    "impact": {
      "level": "high",
      "audience": [
        "Backend teams",
        "Security owners"
      ],
      "reason": {
        "en": "Validation flaws can affect external request handling directly.",
        "ko": "검증 계층의 결함은 외부 요청 처리에 직접 연결됩니다."
      }
    },
    "sourceCount": 1,
    "sources": [
      {
        "title": "FastAPI GitHub Releases",
        "url": "https://github.com/fastapi/fastapi/releases",
        "type": "security",
        "host": "github.com",
        "isOfficial": true,
        "publishedAt": "2026-04-06T06:30:00Z"
      }
    ],
    "publishedAt": "2026-04-06T06:30:00Z",
    "readTime": "2 min"
  }
];

export const availableStacks = [
  "Backend",
  "Database",
  "FastAPI",
  "NestJS",
  "Next.js",
  "Node.js",
  "Prisma",
  "Python",
  "React",
  "TypeScript",
  "Vercel"
];

export const generatedContentMeta: ContentMeta = {
  "generatedAt": "2026-04-14T07:00:25.662Z",
  "issueCount": 8,
  "sourceCount": 10,
  "officialSourceCount": 10,
  "fallbackSourceCount": 0,
  "lastUpdatedAt": "2026-04-13T02:30:00Z",
  "fetchMode": "fixture",
  "enrichmentMode": "baseline"
};
