-- AlterTable
ALTER TABLE "User" ADD COLUMN "lastLoginAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AnalyticsPageView" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "visitorKey" TEXT NOT NULL,
    "referrer" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsPageView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsProductEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT,
    "meta" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsProductEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalyticsPageView_createdAt_idx" ON "AnalyticsPageView"("createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsPageView_visitorKey_createdAt_idx" ON "AnalyticsPageView"("visitorKey", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsProductEvent_name_createdAt_idx" ON "AnalyticsProductEvent"("name", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsProductEvent_createdAt_idx" ON "AnalyticsProductEvent"("createdAt");
