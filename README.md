# m1k

> 버려지는 사이드 말고, 가꿔지는 사이드로.

바이브코딩으로 만든 서비스, 주말에 만든 토이 프로젝트, 해커톤에서 만든 앱 —
만들고 끝이 아니라, **첫 1,000명의 방문자를 함께 만들어가는 곳.**

뱃지 하나 달면 달라져요. 누군가 찾아왔다는 숫자 하나가, 포기 대신 한 번 더 손보게 만들어요.

## Quick Start

```md
[![Hits](https://m1k.app/badge/YOUR_SLUG.svg)](https://m1k.app/YOUR_SLUG)
```

1. [m1k.app](https://m1k.app)에서 로그인
2. 내 사이트 URL 등록
3. 발급된 배지 코드를 README/사이트에 붙여넣기
4. 뱃지가 로드되면 자동으로 인증 완료 — 탐색 목록에 노출

## 주요 기능

### 방문자 추적
- **SVG 배지 카운터** — Flat, Square, Rounded, 싸이월드 4종 스타일
- **IP 중복 제거** — SHA-256 해시 기반 하루 1회 카운트
- **실시간 폴링** — 대시보드 30초 자동 갱신
- **하위 뱃지** — 페이지별 독립 카운터 (`/about`, `/post/123` 등)

### 분석
- **국가/디바이스/유입 경로** — 자동 수집
- **잔디 히트맵** — GitHub 스타일 연간 방문 현황
- **스트릭** — 연속 방문일 추적 (7일+ 불꽃 모드)

### 게이미피케이션
- **동적 목표** — 1K -> 10K -> 100K -> 1M 자동 전환
- **달성 뱃지 39개** — 누적/주간/일간/스트릭 카테고리
- **1K 레이스 랭킹** — 탐색 탭 TOP 5 리더보드
- **Confetti** — 목표 달성 시 축하 애니메이션

### 부스트
- **1 부스트 = 방문자 +1** — 뱃지 카운터에 합산
- 내 사이트에 쓰거나, 친구 사이트에 응원으로 선물
- 가입 시 100 부스트 무료 지급
- 대시보드에서 실제 방문 vs 부스트 분리 확인

### 인증 & 보안
- **Referer 기반 소유권 인증** — 뱃지를 사이트에 심어야 등록 완료
- **DNS 도메인 검증** — 실존하는 도메인만 등록 가능
- **로그인 필수 등록** — Google OAuth (Clerk)

## hits.sh와 비교

| | hits.sh | m1k |
|---|---|---|
| 카운터 | 매번 +1 | IP 해시 중복 제거 |
| 소유권 인증 | X | Referer 검증 |
| 페이지별 추적 | X | 하위 뱃지 |
| 국가/디바이스 분석 | X | O |
| 스트릭 | X | 연속 방문일 추적 |
| 게이미피케이션 | X | 39개 뱃지 + 랭킹 + confetti |
| 부스트 (응원) | X | 1부스트 = 1명 |
| 실시간 갱신 | X | 30초 폴링 |
| 로고 삽입 | O (simple-icons) | X |
| extraCount | O | 부스트로 대체 |

## 배지 파라미터

```
https://m1k.app/badge/SLUG.svg?label=m1k&color=ec4899&style=flat
```

| 파라미터 | 기본값 | 설명 |
|---|---|---|
| `label` | m1k | 배지 라벨 텍스트 |
| `color` | 테마색 | 배지 색상 (hex, # 없이) |
| `style` | flat | `flat` `flat-square` `rounded` `cyworld` |
| `type` | total | `total` `today` `weekly` `monthly` |
| `view` | false | `true`면 카운트 안 올림 |

## 기술 스택

- **Next.js 16** (App Router, Turbopack)
- **Tailwind CSS v4**
- **Neon** (PostgreSQL) + **Drizzle ORM**
- **Clerk** (Google OAuth)
- **Paddle** (결제)
- **Vercel** (호스팅)

## 로컬 개발

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

### 환경변수

```env
DATABASE_URL=           # Neon PostgreSQL
CLERK_SECRET_KEY=       # Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
IP_HASH_SALT=           # IP 해시 솔트

# Paddle (선택)
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=
NEXT_PUBLIC_PADDLE_ENV=sandbox
PADDLE_WEBHOOK_SECRET=
```

## 달성 뱃지 로드맵

```
1K 여정     🌱 🐣 🔥 ⭐ 👑 💎 🏆 🚀
10K 우주    🛸 🌕 ☄️ 🪐
100K 은하   🌌 🔭 🌠 💫
1M 신화     🏛️ 🗿 ⚜️ 👼

주간        🐢 🐇 🦅 🐉 🦖 🐋
일간        ☀️ 🌈 ⚡ 🌋 🌪️ ☄️
스트릭      📅 🔥 💪 🎯 🏅 🐐 ♾️
```

## 라이선스

MIT
