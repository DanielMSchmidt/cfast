import type { Db } from "@cfast/db";
import { nanoid } from "nanoid";
import { auditLogs } from "./db/schema";

/**
 * Creates an audit log insert operation.
 * Use with compose/composeSequential to batch with other operations.
 */
export function auditLog(
  db: Db,
  userId: string,
  action: string,
  target: { type: string; id: string },
  metadata?: Record<string, unknown>,
) {
  return db.unsafe().insert(auditLogs).values({
    id: nanoid(),
    userId,
    action,
    targetType: target.type,
    targetId: target.id,
    metadata: metadata ? JSON.stringify(metadata) : null,
  });
}
