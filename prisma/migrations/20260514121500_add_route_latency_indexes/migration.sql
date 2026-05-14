-- CreateIndex
CREATE INDEX "Article_status_date_idx" ON "Article"("status", "date");

-- CreateIndex
CREATE INDEX "Article_series_status_seriesOrder_idx" ON "Article"("series", "status", "seriesOrder");

-- CreateIndex
CREATE INDEX "Article_updatedAt_idx" ON "Article"("updatedAt");

-- CreateIndex
CREATE INDEX "Series_updatedAt_idx" ON "Series"("updatedAt");

-- CreateIndex
CREATE INDEX "Video_createdAt_idx" ON "Video"("createdAt");