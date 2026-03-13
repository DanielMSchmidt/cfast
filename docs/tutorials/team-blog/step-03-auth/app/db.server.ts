import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
import { env } from "./env.server";

export function getDb() {
  const { DB } = env.get();
  return drizzle(DB, { schema });
}
