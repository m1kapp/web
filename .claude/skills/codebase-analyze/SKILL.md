---
name: codebase-analyze
description: 코드베이스 복잡도를 다각도로 분석하고 유명 JS/TS 라이브러리와 비교한 리포트 생성
---

현재 코드베이스를 다각도로 분석해서 복잡도 리포트를 만들어줘.

분석 대상 경로: $ARGUMENTS (없으면 현재 작업 디렉토리 기준으로 src/, app/, lib/ 등 소스 디렉토리 자동 탐지)

---

## Phase 1: 데이터 수집 (병렬)

**반드시 아래 3개 에이전트를 Agent 도구로 동시에(병렬로) 실행한다.**

### Agent 1: 코드 볼륨 분석

아래 순서로 데이터를 수집하고 JSON으로 반환:

```bash
# 1. 확장자별 파일 수 & LOC
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.mjs" -o -name "*.cjs" \) \
  ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/dist/*" ! -path "*/build/*" ! -path "*/.git/*" \
  | xargs wc -l 2>/dev/null | sort -rn | head -5

# 2. 확장자별 집계
find . -type f \
  ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/dist/*" ! -path "*/build/*" ! -path "*/.git/*" \
  | sed 's/.*\.//' | sort | uniq -c | sort -rn | head -20

# 3. 소스 파일만 LOC 합계 (확장자별)
for ext in ts tsx js jsx mjs cjs css scss; do
  count=$(find . -name "*.$ext" ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/dist/*" ! -path "*/build/*" -type f | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')
  files=$(find . -name "*.$ext" ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/dist/*" ! -path "*/build/*" -type f | wc -l)
  echo "$ext: ${count:-0} lines, ${files:-0} files"
done

# 4. 상위 15개 대용량 파일
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
  ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/dist/*" ! -path "*/build/*" \
  | xargs wc -l 2>/dev/null | sort -rn | head -16 | tail -15

# 5. 디렉토리 깊이 분포
find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
  ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/dist/*" ! -path "*/build/*" \
  | awk -F/ '{print NF-1}' | sort -n | uniq -c
```

반환값: `{ totalLOC, byExtension: [{ext, files, loc}], top15Files: [{path, loc}], depthDistribution: [{depth, count}] }`

---

### Agent 2: 복잡도 (분기·함수) 분석

아래 순서로 복잡도 지표를 수집하고 JSON으로 반환:

```bash
# 1. 분기문 총 카운트 (소스 파일 기준)
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
  ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/dist/*" ! -path "*/build/*" \
  | xargs grep -h -o '\bif\b\|\belse\b\|\bswitch\b\|\bcase\b\|\bfor\b\|\bwhile\b\|\bdo\b' 2>/dev/null \
  | sort | uniq -c | sort -rn

# 2. 3항 연산자 & 논리 단락 평가 (null 병합 포함)
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
  ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/dist/*" ! -path "*/build/*" \
  | xargs grep -hc '?\s\|??\s\| && \| || ' 2>/dev/null | awk '{s+=$1} END {print "short-circuit+ternary:", s}'

# 3. 함수 선언 수 (화살표 포함)
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
  ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/dist/*" ! -path "*/build/*" \
  | xargs grep -hc 'function \|=> {' 2>/dev/null | awk '{s+=$1} END {print "functions:", s}'

# 4. React 컴포넌트 수 (export default function / export function / const Comp =)
find . -type f \( -name "*.tsx" -o -name "*.jsx" \) \
  ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/dist/*" ! -path "*/build/*" \
  | xargs grep -hc 'export default function\|export function\|export const [A-Z]' 2>/dev/null | awk '{s+=$1} END {print "components:", s}'

# 5. 파일별 복잡도 TOP 10 (분기문 밀도 기준)
find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
  ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/dist/*" ! -path "*/build/*" \
  | while read f; do
    branches=$(grep -c '\bif\b\|\bswitch\b\|\bfor\b\|\bwhile\b' "$f" 2>/dev/null || echo 0)
    lines=$(wc -l < "$f" 2>/dev/null || echo 1)
    echo "$branches $lines $f"
  done | sort -rn | head -10

# 6. 클래스 수 & 인터페이스 수 (TS)
find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
  ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/dist/*" ! -path "*/build/*" \
  | xargs grep -hc '\bclass \b' 2>/dev/null | awk '{s+=$1} END {print "classes:", s}'

find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
  ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/dist/*" ! -path "*/build/*" \
  | xargs grep -hc '\binterface \b\|\btype [A-Z]' 2>/dev/null | awk '{s+=$1} END {print "types+interfaces:", s}'
```

총 분기 수를 계산할 때: if + else + switch + case + for + while + do + ternary/short-circuit 전부 합산.

반환값:
```json
{
  "totalBranches": 0,
  "branchByKeyword": {"if": 0, "else": 0, "switch": 0, "case": 0, "for": 0, "while": 0, "shortCircuit": 0},
  "totalFunctions": 0,
  "totalComponents": 0,
  "totalClasses": 0,
  "totalTypesInterfaces": 0,
  "top10ComplexFiles": [{"path": "", "branches": 0, "lines": 0, "density": 0}]
}
```

---

### Agent 3: 구조·의존성 분석

아래 데이터를 수집하고 JSON으로 반환:

```bash
# 1. package.json 의존성 수
cat package.json 2>/dev/null | python3 -c "
import json,sys
d=json.load(sys.stdin)
dep = len(d.get('dependencies',{}))
dev = len(d.get('devDependencies',{}))
peer = len(d.get('peerDependencies',{}))
print(f'dependencies: {dep}, devDependencies: {dev}, peerDependencies: {peer}, total: {dep+dev+peer}')
" 2>/dev/null || echo "package.json not found"

# 2. 가장 많이 import되는 내부 모듈 TOP 10
find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
  ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/dist/*" ! -path "*/build/*" \
  | xargs grep -h "^import\|^} from\|from '" 2>/dev/null \
  | grep -oP "from '[^']+'" \
  | grep -v "node_modules\|^from 'react\|^from 'next\|^from '@" \
  | sort | uniq -c | sort -rn | head -10

# 3. 외부 패키지 import 빈도 TOP 15
find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
  ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/dist/*" ! -path "*/build/*" \
  | xargs grep -h "from '" 2>/dev/null \
  | grep -oP "from '(@[^/']+/[^/']+|[^./'][^/']*)" \
  | sort | uniq -c | sort -rn | head -15

# 4. 디렉토리 구조 (2레벨)
find . -maxdepth 2 -type d \
  ! -path "*/node_modules*" ! -path "*/.next*" ! -path "*/dist*" ! -path "*/build*" ! -path "*/.git*" \
  | sort

# 5. 순환 의존성 단서 탐지 (같은 폴더 내 상호 import)
find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
  ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/dist/*" ! -path "*/build/*" \
  | xargs grep -l "from '\.\." 2>/dev/null | wc -l | xargs echo "relative-parent-import files:"

# 6. 테스트 파일 비율
total=$(find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/dist/*" | wc -l)
tests=$(find . -type f \( -name "*.test.*" -o -name "*.spec.*" -o -name "__tests__" \) ! -path "*/node_modules/*" | wc -l)
echo "total source files: $total, test files: $tests"
```

반환값:
```json
{
  "dependencies": {"prod": 0, "dev": 0, "peer": 0, "total": 0},
  "topInternalImports": [{"module": "", "count": 0}],
  "topExternalPackages": [{"package": "", "count": 0}],
  "directoryStructure": [],
  "testRatio": {"totalFiles": 0, "testFiles": 0, "ratio": "0%"}
}
```

---

## Phase 2: 핫스팟 심층 분석 (병렬)

Phase 1에서 식별된 **복잡도 상위 3개 파일**과 **500줄 이상 파일**을 실제로 읽어서 심층 분석한다.

**반드시 아래 에이전트들을 Agent 도구로 동시에(병렬로) 실행한다.**

각 에이전트에게 아래를 지시:

> 해당 파일을 Read 도구로 전체 읽고, 아래 관점으로 분석해서 **구체적인 개선안**을 반환하라.
> 일반적인 조언이 아니라, 실제 코드에서 발견한 **구체적인 함수명·라인·패턴**을 인용해서 제안하라.
>
> ### 분석 관점
>
> **A. 파일 분리 가능성**
> - 500줄 이상이면: 어떤 책임(관심사)이 섞여 있는지 파악하고, 몇 개 파일로 어떻게 쪼갤 수 있는지 제안 (예: `UserCard.tsx` → `UserCardHeader.tsx` + `UserCardActions.tsx`)
> - 분리 기준: 독립적으로 테스트 가능한 단위, 재사용 가능한 단위, 변경 빈도가 다른 단위
>
> **B. 복잡도 핫스팟 제거**
> - 분기문이 밀집된 함수를 찾아 Early Return, 전략 패턴, 룩업 테이블 등으로 단순화 제안
> - 중첩된 조건문(depth 3+): 플래트닝 방법 제시
> - 반복되는 if-else 패턴: Map/Record로 대체 가능한지 확인
>
> **C. 중복·재사용 기회**
> - 2곳 이상에서 비슷한 로직 발견 시 추출 위치 제안 (`lib/`, `hooks/`, `utils/` 등)
> - 인라인 상수·매직 넘버: 명명된 상수로 분리
>
> **D. 타입 안전성**
> - `any` 사용 여부
> - 런타임에서 검증하지 않는 외부 입력
> - 좁혀지지 않은 union type 처리
>
> **E. 테스트 용이성 (Testability)**
> - 사이드이펙트(fetch, DB, 파일 IO)가 비즈니스 로직과 뒤섞인 부분
> - 순수 함수로 추출 가능한 로직 지목
> - 테스트를 먼저 작성한다면 가장 먼저 커버해야 할 케이스 2~3개 제안
>
> 반환 형식:
> ```
> {
>   file: "경로",
>   splitProposal: { worthSplitting: bool, proposedFiles: [{name, responsibility, estimatedLOC}] },
>   complexityFixes: [{ location: "함수명/라인", problem: "...", fix: "...", effort: "low|medium|high" }],
>   duplicates: [{ description, extractTo }],
>   typeSafety: [{ issue, fix }],
>   testSuggestions: { firstTestCases: ["..."], pureExtractCandidates: ["함수명"] }
> }
> ```

---

## Phase 3: 리포트 생성

Phase 1·2의 모든 데이터를 통합하여 아래 형식으로 최종 리포트를 출력한다.

---

### 출력 형식

```
# 코드베이스 복잡도 리포트
> 분석 시각: YYYY-MM-DD | 경로: <분석 경로>

---

## 📦 코드 볼륨

| 지표 | 값 |
|------|-----|
| 총 소스 파일 수 | N개 |
| 총 라인 수 (LOC) | N줄 |
| 공백·주석 제외 추정 | ~N줄 (LOC × 0.7) |
| 평균 파일 크기 | N줄/파일 |
| 최대 파일 | path (N줄) |

### 언어별 분포
| 확장자 | 파일 수 | LOC | 비중 |
|--------|---------|-----|------|
| .tsx   | N       | N   | N%   |
| ...    |         |     |      |

### 대용량 파일 TOP 10
| 순위 | 파일 | LOC |
|------|------|-----|
| 1    | ...  | N   |

---

## 🔀 복잡도 (분기·함수)

| 지표 | 값 |
|------|-----|
| 총 분기 수 | N |
| 함수 수 | N |
| React 컴포넌트 수 | N |
| 클래스 수 | N |
| 타입/인터페이스 수 | N |
| 분기 밀도 (분기/LOC) | N% |
| 함수당 평균 LOC | N줄 |

### 분기 유형 분포
| 키워드 | 횟수 | 비중 |
| if     | N    | N%   |
| ...    |      |      |

### 복잡도 상위 파일 TOP 10
| 파일 | 분기 수 | LOC | 밀도 |
|------|---------|-----|------|

---

## 🏗️ 구조·의존성

| 지표 | 값 |
|------|-----|
| 프로덕션 의존성 | N개 |
| 개발 의존성 | N개 |
| 테스트 파일 비율 | N% (N/N) |
| 디렉토리 깊이 최대 | N |
| 디렉토리 깊이 평균 | N |

### 가장 많이 임포트되는 내부 모듈
| 모듈 | 참조 횟수 |
|------|-----------|

### 외부 패키지 사용 빈도
| 패키지 | 참조 횟수 |
|--------|-----------|

---

## 📊 유명 JS/TS 라이브러리와 비교

> 기준: 소스 코드 기준 (node_modules, dist, test 제외), 공개 저장소 기준 추정치

| 프로젝트 | LOC | 파일 수 | 총 분기 | 분기 밀도 | 의존성 | 성격 |
|---------|-----|---------|---------|-----------|--------|------|
| **[현재 프로젝트]** | **N** | **N** | **N** | **N%** | **N** | — |
| zustand | ~600 | ~15 | ~80 | ~13% | 0 | 상태관리 (극소형) |
| axios | ~2,500 | ~30 | ~400 | ~16% | 0 | HTTP 클라이언트 |
| zod | ~5,000 | ~50 | ~1,200 | ~24% | 0 | 스키마 검증 |
| express | ~4,000 | ~60 | ~600 | ~15% | 5 | 웹 프레임워크 |
| lodash | ~15,000 | ~330 | ~3,000 | ~20% | 0 | 유틸리티 |
| moment.js | ~11,000 | ~20 | ~2,000 | ~18% | 0 | 날짜 처리 |
| react (core) | ~25,000 | ~200 | ~4,500 | ~18% | 0 | UI 라이브러리 |
| vue 3 (runtime-core) | ~28,000 | ~220 | ~5,500 | ~20% | 0 | UI 프레임워크 |
| nestjs (core) | ~22,000 | ~300 | ~3,200 | ~15% | 8 | Node 프레임워크 |
| next.js (server) | ~120,000 | ~1,200 | ~22,000 | ~18% | 20+ | 풀스택 프레임워크 |
| typescript (checker) | ~220,000 | ~10 | ~55,000 | ~25% | 0 | TS 컴파일러 |

### 포지셔닝 해석
현재 프로젝트의 규모와 복잡도를 위 표와 비교하여 아래를 서술:
- 어떤 라이브러리 사이에 위치하는지
- 분기 밀도가 평균(~18%)보다 높은지 낮은지, 의미 해석
- 파일당 LOC 기준 코드 분산도 평가 (300줄 이상 파일이 많으면 분리 검토 권장)
- 테스트 커버리지 수준 (테스트 파일 비율 기준)
- 의존성 수 대비 프로젝트 규모의 적정성

---

## 🔬 핫스팟 심층 분석

Phase 2에서 에이전트가 실제 코드를 읽고 발견한 내용을 파일별로 서술한다.
각 파일마다 아래 구조로 출력:

```
### `파일경로` (N줄 | 분기 N개)

**분리 제안** (해당하는 경우)
현재 이 파일은 [책임 A]와 [책임 B]가 섞여 있다.
→ `NewFile1.tsx` — [책임 A] 담당, 예상 ~N줄
→ `NewFile2.tsx` — [책임 B] 담당, 예상 ~N줄

**복잡도 제거**
- `함수명()` (L123): [문제]. → [구체적 수정 방향] (effort: low)
- ...

**중복·추출**
- [설명] → `lib/xxx.ts`로 추출

**타입 안전성**
- [이슈] → [수정 방향]

**테스트 우선순위**
먼저 커버할 케이스: [케이스1], [케이스2]
순수 함수 추출 후보: `함수명()`
```

---

## 🗺️ 개선 후보 목록

Phase 1·2 데이터를 종합해서 개선 후보를 **리스크 등급별**로 분류한다.

### 리스크 등급 기준

| 등급 | 기준 | 예시 |
|------|------|------|
| 🟢 Safe | 단일 파일·단일 함수 내 변경, 외부 영향 없음 | 상수화, Early Return, 매직 넘버 |
| 🟡 Careful | 2~3개 파일 연동, import 관계 변경 | 헬퍼 추출, 훅 분리 |
| 🔴 Risky | 여러 파일 파급, 타입 변경, 런타임 동작 변경, 대형 리팩터링 | 파일 분리, API 응답 형식 변경, 전역 타입 수정 |

**🔴 Risky 항목은 목록에 표시만 하고 실행하지 않는다.** 이유와 함께 별도로 언급만 한다.

```
### 🟢 Safe — 바로 적용 가능
| # | 작업 | 파일 | AS-IS 요약 | TO-BE 요약 |
|---|------|------|-----------|-----------|
| 1 | ... | ... | ... | ... |

### 🟡 Careful — 영향 파일 N개, 확인 후 적용
| # | 작업 | 영향 파일 | AS-IS 요약 | TO-BE 요약 |
|---|------|-----------|-----------|-----------|
| 1 | ... | ... | ... | ... |

### 🔴 Risky — 이번엔 건너뜀 (이유 명시)
| # | 작업 | 이유 |
|---|------|------|
| 1 | ... | 파일 N개 파급 / 런타임 동작 변경 / 대형 리팩터링 |
```

**테스트 커버리지 로드맵** (테스트가 0%인 경우)
1. 순서: 비즈니스 로직(lib/) → API 라우트 → UI 컴포넌트
2. 첫 번째로 작성할 테스트 파일과 케이스 3개를 구체적으로 제시
3. 추천 테스트 프레임워크 (프로젝트 스택 기준)

**의존성 감사**
- 실제로 사용 중인지 의심스러운 패키지 지목
- 더 가벼운 대안이 있는 패키지 제안 (크기 비교 포함)
- peer로 올릴 수 있는 deps 제안 (라이브러리인 경우)
```

---

리포트 출력이 끝나면 아래 문구로 마무리한다:

```
---
🟢 Safe N개 · 🟡 Careful N개 항목을 준비했습니다.
**gogo** 라고 하시면 위 순서대로 하나씩 적용하며 각 항목마다 AS-IS → TO-BE를 보여드립니다.
특정 번호만 원하시면 "1, 3번만" 처럼 말씀해주세요.
```

---

## Phase 4: 실행 (사용자가 "gogo" 또는 번호를 지정했을 때만)

사용자가 **gogo** 또는 특정 번호를 말하면 이 Phase로 진입한다.

### 실행 원칙

1. **한 항목씩** 처리한다. 여러 항목을 한 번에 묶어서 적용하지 않는다.
2. 각 항목 적용 전에 반드시 **AS-IS → TO-BE** 를 먼저 보여준다.
3. 코드를 수정한 뒤에는 **변경 요약** (몇 줄 수정, 어떤 패턴 제거)을 한 줄로 출력한다.
4. 🟡 Careful 항목은 실행 전 영향 파일 목록을 한 번 더 확인하고 진행한다.
5. 🔴 Risky 항목은 **절대 실행하지 않는다**. 사용자가 명시적으로 요청해도 위험 이유를 설명하고 사용자 판단에 맡긴다.

### 항목당 출력 형식

```
## ✏️ [#N] 작업명

**파일**: `경로`

**AS-IS**
```코드 스니펫 (변경 전 핵심 부분)```

**TO-BE**
```코드 스니펫 (변경 후 핵심 부분)```

> 적용합니다...

[코드 수정 실행]

✅ 완료 — N줄 수정, [무엇이 제거/개선됐는지 한 줄]
다음: [#N+1] 작업명 — 진행할까요? (gogo / 건너뜀)
```

### Risky 항목 거절 형식

```
## ⛔ [#N] 작업명 — 실행 안 함

이유: [파급 파일 N개 / 런타임 동작 변경 / 타입 시그니처 변경 등]
코드베이스 규모에 따라 사이드이펙트가 클 수 있어 제안만 드립니다.
직접 적용을 원하신다면 별도 작업으로 진행해 주세요.
```

---

## 주의사항

- `node_modules`, `.next`, `dist`, `build`, `.git` 디렉토리는 **반드시 제외**한다.
- lock 파일(package-lock.json, yarn.lock, pnpm-lock.yaml), 자동생성 파일(*.d.ts in dist, schema.prisma generated)은 분석에서 제외한다.
- 명령어 실패 시 0 또는 "N/A"로 채우고 분석을 계속한다. 에러로 중단하지 않는다.
- 분기 수 계산: `if` + `else if` + `switch` + `case` + `for` + `forEach` + `while` + `do` + `? ` (ternary) + `&&` (단락평가) 합산.
- 비교 테이블의 참조 수치는 각 라이브러리의 공개 저장소 기준 추정치이며, 현재 프로젝트 수치는 실측값이다.
