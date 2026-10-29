import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type * as schema from "./schema";

/**
 * Kiểu database chung cho Neon (chạy thật) và PGlite (chạy test),
 * để logic nghiệp vụ nhận `db` vào và kiểm thử được trên Postgres thật.
 */
export type AppDb = PgDatabase<PgQueryResultHKT, typeof schema>;
