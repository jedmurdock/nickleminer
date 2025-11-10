-- CreateTable
CREATE TABLE "shows" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "title" TEXT,
    "playlist_url" TEXT NOT NULL,
    "archive_url" TEXT,
    "audio_format" TEXT,
    "audio_path" TEXT,
    "duration" INTEGER,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracks" (
    "id" TEXT NOT NULL,
    "show_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "artist" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "album" TEXT,
    "label" TEXT,
    "year" INTEGER,
    "comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shows_playlist_url_key" ON "shows"("playlist_url");

-- CreateIndex
CREATE INDEX "shows_date_idx" ON "shows"("date");

-- CreateIndex
CREATE INDEX "shows_processed_idx" ON "shows"("processed");

-- CreateIndex
CREATE INDEX "tracks_show_id_idx" ON "tracks"("show_id");

-- CreateIndex
CREATE INDEX "tracks_artist_idx" ON "tracks"("artist");

-- CreateIndex
CREATE INDEX "tracks_title_idx" ON "tracks"("title");

-- AddForeignKey
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_show_id_fkey" FOREIGN KEY ("show_id") REFERENCES "shows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
