import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createServer, type Server } from "node:http";
import { before, after, beforeEach, test, mock } from "node:test";
import { neonConfig } from "@neondatabase/serverless";
import type { HitEntry } from "../src/lib/hit-buffer";

const pg = `m1k-usage-pg-${process.pid}`;
const kv = `m1k-usage-redis-${process.pid}`;
let bridge: Server;
let buffer: typeof import("../src/lib/hit-buffer");
let flush: typeof import("../src/lib/flush-hits");
const docker = (args: string[], input?: string) => execFileSync("docker", args, { input, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
const psql = (query: string) => docker(["exec", "-i", pg, "psql", "-h", "127.0.0.1", "-U", "postgres", "-qAt", "-v", "ON_ERROR_STOP=1"], query);
const command = (...args: (string | number)[]) => JSON.parse(docker(["exec", kv, "redis-cli", "--json", ...args.map(String)]));
const date = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
const entry = (ipHash: string): HitEntry => ({ siteId: 1, ipHash, date, hourKST: 12, country: "KR", city: "Seoul", device: "desktop", browser: "Chrome", os: "macOS", referer: null });

function bind(q: { sql: string; params: unknown[] }) {
  return q.sql.replace(/\$(\d+)/g, (_, i) => `'${String(q.params[Number(i) - 1]).replaceAll("'", "''")}'`);
}

before(async () => {
  docker(["run", "--rm", "-d", "--name", pg, "-e", "POSTGRES_HOST_AUTH_METHOD=trust", "postgres:17"]);
  docker(["run", "--rm", "-d", "--name", kv, "redis:7-alpine"]);
  for (let i = 0; i < 50; i++) {
    try { psql("SELECT 1"); break; } catch { await new Promise((r) => setTimeout(r, 100)); }
  }
  psql(execFileSync(process.execPath, ["node_modules/drizzle-kit/bin.cjs", "export", "--dialect=postgresql", "--schema=src/lib/db/schema.ts"], { encoding: "utf8" }));
  psql("INSERT INTO sites (id, slug) VALUES (1, 'test');");
  // Upstash SDK의 HTTP 요청만 로컬 Redis에 연결한다. 외부 서비스는 사용하지 않는다.
  bridge = createServer(async (req, res) => {
    let body = "";
    for await (const chunk of req) body += chunk;
    const parsed = JSON.parse(body);
    const run = (cmd: (string | number)[]) => ({ result: command(...cmd) });
    try {
      const result = req.url === "/pipeline" || req.url === "/multi-exec" ? parsed.map(run) : run(parsed);
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(result));
    } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: String(e) })); }
  });
  await new Promise<void>((resolve) => bridge.listen(0, "127.0.0.1", resolve));
  const address = bridge.address() as { port: number };
  process.env.UPSTASH_REDIS_REST_URL = `http://127.0.0.1:${address.port}`;
  process.env.UPSTASH_REDIS_REST_TOKEN = "local-test";
  // 실제 Neon 드라이버/Drizzle 트랜잭션을 통과시키되 SQL은 테스트 PostgreSQL에서만 실행한다.
  neonConfig.fetchFunction = async (_url: RequestInfo | URL, options?: RequestInit) => {
    const body = JSON.parse(String(options?.body));
    assert.ok(Array.isArray(body.queries), "only a transaction is expected");
    assert.match(body.queries[0].query, /pg_advisory_xact_lock/);
    try {
      const output = psql("BEGIN;\n" + body.queries.map((q: { query: string; params: unknown[] }) => bind({ sql: q.query, params: q.params })).join(";\n") + ";\nCOMMIT;");
      const inserted = output.split("\n").at(-1)!;
      return Response.json({ results: [
        { fields: [{ name: "pg_advisory_xact_lock", dataTypeID: 2278 }], rows: [[""]], rowCount: 1, command: "SELECT" },
        { fields: [{ name: "inserted", dataTypeID: 23 }], rows: [[inserted]], rowCount: 1, command: "SELECT" },
      ] });
    } catch {
      return Response.json({ message: "test PostgreSQL rejected the transaction" }, { status: 400 });
    }
  };
  buffer = await import("../src/lib/hit-buffer");
  flush = await import("../src/lib/flush-hits");
});

after(async () => {
  await new Promise<void>((resolve) => bridge?.close(() => resolve()) ?? resolve());
  for (const name of [pg, kv]) { try { docker(["stop", name]); } catch { /* setup may have failed */ } }
});

beforeEach(() => {
  mock.restoreAll();
  command("FLUSHDB");
  psql("TRUNCATE hit_logs, hits, daily_geo_stats, daily_device_stats, daily_hour_stats; UPDATE sites SET total_hits = 0;");
});

test("DB failure keeps queued visits; retry commits all aggregates exactly once", async () => {
  await buffer.bufferHit(entry("a"));
  const batch = await buffer.readPendingHits();
  const broken = batch.entries.map((e) => ({ ...e, device: null })) as unknown as HitEntry[];
  await assert.rejects(flush.flushEntries(broken), /rejected the transaction/);
  assert.equal(command("LLEN", "hit:logs"), 1);
  assert.equal(psql("SELECT count(*) FROM hit_logs"), "0");
  assert.equal(psql("SELECT total_hits FROM sites WHERE id=1"), "0");
  assert.equal(await flush.flushEntries(batch.entries), 1);
  assert.equal(await flush.flushEntries(batch.entries), 0); // DB commit succeeded but response/ack was lost.
  for (const table of ["hits", "daily_geo_stats", "daily_device_stats", "daily_hour_stats"]) {
    assert.equal(psql(`SELECT sum(count) FROM ${table}`), "1", table);
  }
  assert.equal(psql("SELECT count(*) FROM hit_logs"), "1");
  assert.equal(psql("SELECT total_hits FROM sites WHERE id=1"), "1");
  const snapshot = { today: 1, total: 1, weekly: 1, monthly: 1, updatedAt: new Date().toISOString() };
  assert.equal(await buffer.acknowledgeHits(batch, [{ siteId: 1, slug: "test", site: { id: 1 }, snapshot }]), true);
  assert.equal(command("LLEN", "hit:logs"), 0);
  assert.equal(await buffer.getBufferedTotal(1), 0);
  assert.equal((await buffer.getCountSnapshot(1))?.total, 1);
  assert.equal(await buffer.acknowledgeHits(batch, []), false);
  assert.equal(await buffer.getBufferedTotal(1), 0);
});

test("ack preserves visits arriving during flush and duplicate IP is not enqueued", async () => {
  assert.equal(await buffer.bufferHit(entry("a")), true);
  assert.equal(await buffer.bufferHit(entry("a")), false);
  const batch = await buffer.readPendingHits();
  await buffer.bufferHit(entry("b"));
  assert.equal(await buffer.acknowledgeHits(batch, []), true);
  assert.equal(await buffer.getBufferedCount(1, date), 1);
  assert.equal(await buffer.getBufferedTotal(1), 1);
  assert.equal((await buffer.readPendingHits()).entries[0].ipHash, "b");
  assert.equal(await buffer.acknowledgeHits(batch, []), false);
  assert.equal(await buffer.getBufferedTotal(1), 1);
});

test("a deleted site does not block remaining queued visits", async () => {
  await buffer.bufferHit(entry("kept"));
  await buffer.bufferHit({ ...entry("deleted"), siteId: 999 });
  const batch = await buffer.readPendingHits();
  assert.equal(await flush.flushEntries(batch.entries), 1);
  assert.equal(psql("SELECT count(*) FROM hit_logs"), "1");
  assert.equal(await buffer.acknowledgeHits(batch, []), true);
  assert.equal(command("LLEN", "hit:logs"), 0);
});

test("live poll reads one daily query, includes pending visits, and excludes heavy stats", async () => {
  const { db } = await import("../src/lib/db");
  const site = { id: 1, slug: "test", totalHits: 10 };
  await buffer.cacheSite("test", site);
  await buffer.saveCountSnapshot(1, { today: 2, total: 10, weekly: 4, monthly: 8, updatedAt: new Date().toISOString() });
  await buffer.bufferHit(entry("pending"));
  const select = mock.method(db, "select", () => ({ from: () => ({ where: () => ({ orderBy: async () => [{ date, count: 2 }] }) }) }) as never);
  const lookup = mock.method(db.query.sites, "findFirst", () => { throw new Error("unexpected site lookup"); });
  const { GET } = await import("../src/app/api/sites/[...slug]/route");
  const r = await GET(new Request("http://localhost/api/sites/test?view=live"), { params: Promise.resolve({ slug: ["test"] }) });
  assert.equal(r.status, 200);
  const body = await r.json();
  assert.equal(body.total, 11);
  assert.equal(body.todayCount, 3);
  assert.equal(body.weekly, 5);
  assert.equal(body.monthly, 9);
  assert.deepEqual(body.daily, [{ date, count: 3 }]);
  assert.equal(body.countries, undefined);
  assert.equal(body.referers, undefined);
  assert.equal(select.mock.callCount(), 1);
  assert.equal(lookup.mock.callCount(), 0);
});

test("public refresh=1 cannot bypass kit-stats cache", async () => {
  const { redis } = await import("../src/lib/redis");
  await redis!.set("kit-stats:v4", { stats: {}, fetchedAt: "cached" });
  const originalFetch = globalThis.fetch;
  mock.method(globalThis, "fetch", async (url: RequestInfo | URL, options?: RequestInit) => {
    assert.match(String(url), /^http:\/\/127\.0\.0\.1:/, "external fetch must not run");
    return originalFetch(url, options);
  });
  const { GET } = await import("../src/app/api/sites/kit-stats/route");
  const r = await GET(new Request("http://localhost/api/sites/kit-stats?refresh=1"));
  assert.equal(r.status, 200);
  assert.equal((await r.json()).fetchedAt, "cached");
});
