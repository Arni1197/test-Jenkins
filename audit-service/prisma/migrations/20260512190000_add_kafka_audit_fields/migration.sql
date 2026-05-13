ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "eventId" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "requestId" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "sourceService" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "sourceTransport" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "topic" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "entityType" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "entityId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "AuditLog_eventId_key"
ON "AuditLog"("eventId");

CREATE INDEX IF NOT EXISTS "AuditLog_requestId_idx"
ON "AuditLog"("requestId");

CREATE INDEX IF NOT EXISTS "AuditLog_sourceService_idx"
ON "AuditLog"("sourceService");

CREATE INDEX IF NOT EXISTS "AuditLog_sourceTransport_idx"
ON "AuditLog"("sourceTransport");

CREATE INDEX IF NOT EXISTS "AuditLog_topic_idx"
ON "AuditLog"("topic");

CREATE INDEX IF NOT EXISTS "AuditLog_entityType_idx"
ON "AuditLog"("entityType");

CREATE INDEX IF NOT EXISTS "AuditLog_entityId_idx"
ON "AuditLog"("entityId");