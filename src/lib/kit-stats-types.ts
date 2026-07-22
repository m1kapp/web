// kit-stats 수집 API와 스토어 dev 테이블이 공유하는 청결도 타입.
// 예전엔 route.ts와 store-tab.tsx에 같은 인터페이스가 통째로 복붙돼 있었음 → 여기로 단일화.

export interface Bucket {
  files: number;
  codeLines: number;
}

export interface QualityWorstFn {
  name: string;
  cog: number;
  file: string;
  line: number;
}

export interface QualityDupFile {
  file: string;
  dupTokens: number;
}

export interface SiteQuality {
  score: number;
  grade: string;
  engine: string | null;
  branchDensity: number;
  avgFileLines: number | null;
  longFiles: number | null;
  maxFile: { path: string; lines: number } | null;
  cognitive: { avg: number; max: number; over15: number; over25: number; worst: QualityWorstFn[] } | null;
  duplication: { percent: number; worstFiles: QualityDupFile[] } | null;
}
