import "server-only";
import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { getServerEnv } from "@/lib/env";
import * as schema from "./schema";

/**
 * Dùng driver WebSocket của Neon (không phải HTTP) vì `createOrderRequest` cần
 * transaction thật để lưu yêu cầu và các dòng món cùng lúc.
 */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

/**
 * Chạy với Postgres trên máy (DATABASE_URL trỏ về localhost): driver Neon vẫn nói chuyện qua WebSocket,
 * nên cần một cầu nối wsproxy (mặc định cổng 5545, đổi bằng LOCAL_DB_WS_PORT). Neon thật không bị ảnh hưởng.
 */
function configureLocalDatabase(connectionString: string) {
  const { hostname } = new URL(connectionString);
  if (!LOCAL_HOSTS.has(hostname)) return;
  const proxyPort = process.env["LOCAL_DB_WS_PORT"] ?? "5545";
  neonConfig.wsProxy = (host) => `${host}:${proxyPort}/v1`;
  neonConfig.useSecureWebSocket = false;
  neonConfig.pipelineTLS = false;
  neonConfig.pipelineConnect = false;
}

function createDb() {
  const { DATABASE_URL } = getServerEnv();
  configureLocalDatabase(DATABASE_URL);
  const pool = new Pool({ connectionString: DATABASE_URL });
  return drizzle(pool, { schema });
}

let cachedDb: ReturnType<typeof createDb> | undefined;

/** Kết nối database; tạo ở lần gọi đầu để build không cần DATABASE_URL thật. */
export function getDb() {
  cachedDb ??= createDb();
  return cachedDb;
}

export type Db = ReturnType<typeof getDb>;
