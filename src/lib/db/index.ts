import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// 빌드(정적 분석) 단계에선 DATABASE_URL이 없을 수 있는데, neon()은 빈 인자면 즉시 throw한다.
// → placeholder로 폴백(연결은 첫 쿼리 때만 일어나므로 빌드 땐 무해). 런타임 lambda엔 실제 URL이 주입됨.
const _sql = neon(process.env.DATABASE_URL || "postgresql://placeholder:placeholder@127.0.0.1/placeholder");

// Neon cold start 시 fetch failed 에러를 자동 retry (최대 3회, 빠른 간격)
const sql = new Proxy(_sql, {
  apply(target, thisArg, args) {
    const attempt = async (n: number): Promise<unknown> => {
      try {
        return await Reflect.apply(target, thisArg, args);
      } catch (err) {
        const isConnErr = err instanceof Error &&
          (err.message.includes("fetch failed") || err.message.includes("Error connecting to database"));
        if (isConnErr && n < 2) {
          await new Promise(r => setTimeout(r, 150));
          return attempt(n + 1);
        }
        throw err;
      }
    };
    return attempt(0);
  },
});

export const db = drizzle(sql as typeof _sql, { schema });
