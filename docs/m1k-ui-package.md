# @m1k/ui — 모바일 앱 느낌의 웹앱 디자인 시스템

> shadcn 위에 얹는 모바일 웹앱 레이아웃 프레임워크.
> m1k에서 실전 검증된 컴포넌트를 오픈소스로 제공.

## 왜 만드는가

AI 시대에 사이드 프로젝트를 만드는 건 쉬워졌지만, "앱처럼 느껴지는 웹"을 만드는 건 여전히 번거롭다.
모바일 퍼스트, 430px 앱 뷰, 상단 고정 헤더 + 스크롤 콘텐츠 + 하단 탭바 — 이 패턴을 매번 직접 짜는 대신, 한 줄로 세팅.

## 핵심 레이아웃

```
┌─────────────────────┐
│ Header (sticky)     │  ← 뒤로가기, 타이틀, 액션
├─────────────────────┤
│                     │
│ Content (scroll)    │  ← 메인 콘텐츠 영역
│                     │
├─────────────────────┤
│ TabBar (sticky)     │  ← 하단 네비게이션
└─────────────────────┘
     max-w-430px
     center, shadow, ring
```

## 사용 예시

```tsx
import { AppShell, TabBar, Tab, Section, Divider, StatChip, EmptyState } from "@m1k/ui"

export default function App() {
  const [tab, setTab] = useState("home")

  return (
    <AppShell>
      <AppShell.Header title="내 앱" />

      <AppShell.Content>
        {tab === "home" && (
          <>
            <Section>
              <h1>홈</h1>
            </Section>
            <Divider />
            <Section className="flex gap-3">
              <StatChip label="오늘" value={42} />
              <StatChip label="전체" value={1234} />
            </Section>
          </>
        )}
        {tab === "settings" && (
          <Section>
            <EmptyState message="아직 설정이 없어요" />
          </Section>
        )}
      </AppShell.Content>

      <TabBar value={tab} onChange={setTab}>
        <Tab value="home" label="홈" icon={<HomeIcon />} />
        <Tab value="settings" label="설정" icon={<SettingsIcon />} />
      </TabBar>
    </AppShell>
  )
}
```

## 컴포넌트 목록

### 레이아웃
| 컴포넌트 | 설명 |
|---------|------|
| `AppShell` | 430px 앱 컨테이너 (shadow + ring + h-dvh) |
| `AppShell.Header` | 상단 고정 헤더 (blur backdrop) |
| `AppShell.Content` | 스크롤 가능한 콘텐츠 영역 |
| `TabBar` + `Tab` | 하단 네비게이션 탭바 |
| `Watermark` | 배경 패턴 워터마크 |

### UI 요소
| 컴포넌트 | 설명 |
|---------|------|
| `Section` | px-4 패딩 섹션 래퍼 |
| `SectionHeader` | 섹션 제목 (uppercase, tracking-wider) |
| `Divider` | 구분선 |
| `StatChip` | 통계 칩 (라벨 + 숫자) |
| `EmptyState` | 빈 상태 메시지 |

### 상호작용
| 컴포넌트 | 설명 |
|---------|------|
| `Accordion` | 접이식 아코디언 (grid 애니메이션) |
| `CodeSnippet` | 복사 가능한 코드 블록 |

## 테마

- 8색 프리셋 팔레트 (m1k와 동일)
- CSS 변수 기반 accent color
- 라이트/다크 모드 지원
- `**:transition` 으로 색 전환 애니메이션 내장

## 배포 방식

### Option A: shadcn 스타일 (복붙)
```bash
npx m1k-ui add app-shell
npx m1k-ui add tab-bar
```

### Option B: npm 패키지
```bash
npm install @m1k/ui
```

## CLI: create-m1k-app

```bash
npx create-m1k-app my-project
```

### 생성되는 구조
```
my-project/
├── src/
│   ├── app/
│   │   ├── layout.tsx      ← @m1k/ui 세팅 완료
│   │   └── page.tsx        ← 탭 3개 + 샘플 콘텐츠
│   └── components/         ← 커스터마이징용
├── package.json
├── tailwind.config.ts
└── README.md               ← m1k 뱃지 안내 포함
```

### m1k 뱃지 자동 안내

프로젝트 생성 후 터미널에 자동 출력:

```
✅ 프로젝트 생성 완료!

🚀 m1k 뱃지를 달아보세요:
   1. https://m1k.app 에서 로그인
   2. 배포된 사이트 URL 등록
   3. 발급된 배지 코드를 README에 붙여넣기
   4. 방문자가 올 때마다 자동으로 카운트!

   make 1k, m1k !
```

README.md 템플릿에도 뱃지 자리를 미리 마련:

```md
# my-project

<!-- m1k 뱃지: https://m1k.app 에서 등록 후 아래 주석을 교체하세요 -->
<!-- [![Hits](https://m1k.app/badge/YOUR_SLUG.svg)](https://m1k.app/YOUR_SLUG) -->
```

## 성장 루프

```
개발자가 create-m1k-app으로 프로젝트 생성
  → 자연스럽게 m1k 뱃지 안내 노출
  → 배포 후 m1k 등록
  → 뱃지 달기
  → 방문자가 뱃지 클릭 → m1k 유입
  → "나도 해볼까" → 또 create-m1k-app
  → 반복
```

## 기술 스택

- Next.js 16+ (App Router)
- Tailwind CSS v4
- shadcn/ui 기반
- TypeScript

## 우선순위

1. **m1k 배포 + 유저 확보** ← 지금
2. ui-parts.tsx → @m1k/ui 패키지 추출
3. create-m1k-app CLI
4. 문서 사이트 (m1k.app/docs 또는 별도)

## 경쟁/참고

- shadcn/ui — 복붙 방식 컴포넌트 (레이아웃 없음)
- Capacitor/Ionic — 네이티브 래퍼 (무거움)
- Tamagui — 크로스 플랫폼 (복잡함)

@m1k/ui는 "웹만, 모바일 느낌만, 초간단"을 지향.
