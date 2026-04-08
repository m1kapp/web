# m1k

> mini make 1k — 방문자 1,000명을 향한 첫걸음

사이트 주소만 입력하면 배지가 생성되고, 방문자가 올 때마다 카운트.
대시보드에서 **1,000명 목표 달성까지의 여정**을 한눈에 확인하세요.

## 사용법

README나 블로그에 배지 하나 붙이면 끝:

```md
[![Hits](https://m1k.vercel.app/badge/blog.naver.com/dellose.svg)](https://m1k.vercel.app/blog.naver.com/dellose)
```

조회 전용 (카운트 안 올림):
```md
![Hits](https://m1k.vercel.app/badge/blog.naver.com/dellose.svg?view=true)
```

## 주요 기능

- **배지 4종** — Flat, Square, Rounded, 싸이월드(TODAY/TOTAL)
- **1K 프로그레스** — 원형 게이지 + 마일스톤 (250/500/750/1K)
- **잔디 히트맵** — GitHub 잔디처럼 연간 방문 현황 + 연도 필터
- **방문자 분석** — 국가, 디바이스, 리퍼러 자동 수집
- **중복 제거** — IP 해시 기반 하루 1회 카운트
- **OG 스크래핑** — 등록한 사이트의 제목/설명/이미지 자동 수집
- **테마색** — 8색 팔레트, 배지 색상 바꾸면 대시보드도 연동
- **스토어** — 등록된 사이트를 앱스토어처럼 OG 카드로 탐색
- **내 사이트** — Google 로그인 후 내 사이트만 관리/수정

## hits.sh와 뭐가 달라?

| | hits.sh | m1k |
|---|---|---|
| 카운트 | 무조건 +1 | IP 해시 중복 제거 |
| 분석 | 숫자만 | 국가, 디바이스, 리퍼러 |
| 배지 스타일 | 5종 | 4종 + 싸이월드 |
| 시각화 | 캘린더 | 원형 게이지 + 잔디 + 마일스톤 |
| 목표 | 없음 | 1K 게이미피케이션 |
| 소유권 | 없음 | 로그인 기반 관리 |

## 기술 스택

- **Next.js 16** (App Router)
- **Tailwind CSS v4** + **shadcn/ui**
- **Neon** (PostgreSQL) + **Drizzle ORM**
- **Clerk** (Google 로그인)
- **Vercel** (호스팅)

## 로컬 개발

```bash
npm install
cp .env.local.example .env.local
# .env.local에 DATABASE_URL, CLERK 키 설정
npm run dev
```

http://localhost:3335 에서 확인

## 배지 파라미터

| 파라미터 | 기본값 | 설명 |
|---|---|---|
| `label` | m1k | 배지 라벨 |
| `color` | (테마색) | 배지 색상 (hex, # 없이) |
| `style` | flat | flat, flat-square, rounded, cyworld |
| `view` | false | true면 카운트 안 올림 |

## 라이선스

MIT
