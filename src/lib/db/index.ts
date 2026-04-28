import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const _sql = neon(process.env.DATABASE_URL!);

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
