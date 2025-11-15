# MVP Implementation Plan

## Simplified Scope for Learning & Personal Use

Based on discussions, we're building a focused MVP that:
1. Scrapes 2020 WFMU shows only (~50 shows)
2. Downloads full show streams (prefer OGG > AAC/M4A > MP3 > RealAudio)
3. Converts to OGG Vorbis for storage
4. Stores track metadata from HTML (no splitting yet)
5. Provides basic UI to manage jobs and stream shows

**Deferred for later:**
- Track splitting into individual files
- Genre tagging
- Advanced search
- Playlist creation

---

## Phase 1: Foundation (Week 1)

### Tasks:
- [x] Project planning and documentation
- [x] Initialize monorepo structure
- [x] Set up Rancher Desktop infrastructure (PostgreSQL, Redis)
- [x] Initialize backend (Nest.js)
- [x] Initialize frontend (Next.js)
- [x] Set up Prisma with simplified schema

### Simplified Database Schema:

```prisma
model Show {
  id            String    @id @default(uuid())
  date          DateTime
  title         String?
  playlistUrl   String    @unique
  archiveUrl    String?
  rawAudioPath  String?
  rawAudioFormat String?
  audioPath     String?
  audioFormat   String?
  processingState String?
  downloadedAt  DateTime?
  convertedAt   DateTime?
  processed     Boolean   @default(false)
  tracks        Track[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Track {
  id        String   @id @default(uuid())
  showId    String
  show      Show     @relation(fields: [showId], references: [id])
  position  Int
  artist    String
  title     String
  album     String?
  label     String?
  year      Int?
  comments  String?
  createdAt DateTime @default(now())

  @@index([showId])
}
```

---

## Phase 2: Web Scraping (Week 2)

### Goal: Extract 2020 shows and track listings

### Status: ✅ Complete
- Cheerio-based scraper extracts show metadata and tracks
- Resolves archive URLs via `/archiveplayer` and prioritizes formats (OGG first)
- APIs:
  ```
  POST /scraper/scrape-year
  GET  /scraper/shows
  GET  /scraper/shows/:id
  ```

---

## Phase 3: Audio Processing (Week 3)

### Goal: Download and convert to OGG Vorbis

### Status: ✅ Complete
- Download service saves archives to `storage/raw`
- FFmpeg conversion service outputs OGG to `storage/converted`
- `POST /scraper/shows/:id/process` orchestrates download + conversion
- Show records updated with raw/converted paths and timestamps
- Background queue/progress tracking deferred

---

## Phase 4: Audio Streaming (Week 4)

### Goal: Stream converted audio via HTTP

### Status: ✅ Complete
- `GET /shows/:id/stream` endpoint with range support
- Content-Type negotiation (OGG, AAC/M4A, MP3, MP4)
- Falls back to raw archive if conversion missing

---

## Phase 5: Frontend (Weeks 5-6)

### Goal: Admin controls + basic browsing/UI

### Status: ⏳ In Progress
- ✅ `/admin` dashboard to scrape/process shows
- ✅ Home page with navigation links
- ⏳ `/shows` list page (planned)
- ⏳ `/shows/[id]` detail page with audio player (planned)
- ⏳ `/tracks` explorer (future enhancement)

### Next Actions
1. Build shows list/detail pages with streaming audio player
2. Surface processing states/counts in UI
3. Evaluate background processing UX after core browsing flow works

---

## MVP Success Criteria

- [x] Scrape 2020 shows with metadata
- [x] Download archives and convert to OGG
- [x] Stream converted audio via API
- [x] Admin UI to manage scraping/processing
- [ ] User-facing shows/tracks pages with playback (in progress)

Once basic browsing and playback are live, the MVP will be considered feature-complete. Subsequent iterations can tackle splitting, tagging, richer search, and expansion beyond 2020.

