# MVP Implementation Plan

## Simplified Scope for Learning & Personal Use

Based on discussions, we're building a focused MVP that:
1. Scrapes 2020 WFMU shows only (~50 shows)
2. Downloads full show streams (prefer MP3 > RealAudio)
3. Converts to OGG Vorbis for storage
4. Stores track metadata from HTML (no splitting yet)
5. Provides basic UI to browse and play shows

**Deferred for later:**
- Track splitting into individual files
- Genre tagging
- Advanced search
- Playlist creation

---

## Phase 1: Foundation (Week 1)

### Tasks:
- [x] Project planning and documentation
- [ ] Initialize monorepo structure
- [ ] Set up Docker infrastructure (PostgreSQL, Redis)
- [ ] Initialize backend (Nest.js)
- [ ] Initialize frontend (Next.js)
- [ ] Set up Prisma with simplified schema

### Simplified Database Schema:

```prisma
model Show {
  id            String    @id @default(uuid())
  date          DateTime
  title         String?
  playlistUrl   String    @unique
  archiveUrl    String?
  audioPath     String?   // Path to OGG file
  duration      Int?      // Duration in seconds
  processed     Boolean   @default(false)
  tracks        Track[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Track {
  id        String   @id @default(uuid())
  showId    String
  show      Show     @relation(fields: [showId], references: [id])
  position  Int      // Order in playlist
  artist    String
  title     String
  album     String?
  label     String?
  year      Int?
  comments  String?  // Any additional info from HTML
  createdAt DateTime @default(now())
  
  @@index([showId])
}
```

**Note:** No genre tables, playlist tables, or track audio paths for MVP.

---

## Phase 2: Web Scraping (Week 2)

### Goal: Extract 2020 shows and track listings

### Implementation:

1. **Scraper Service** (`backend/src/scraper/`)
   - Fetch https://wfmu.org/playlists/ND
   - Filter for 2020 shows only
   - Extract playlist URLs
   - Parse each playlist page for tracks

2. **Audio URL Detection**
   - Check for available formats in order of preference:
     1. MP3 (320kbps, 192kbps, 128kbps)
     2. AAC/M4A
     3. OGG Vorbis
     4. RealAudio (fallback)
   - Store best available URL

3. **Track Parsing**
   - Extract from HTML table/list:
     - Artist
     - Title
     - Album
     - Label
     - Year
     - Any additional comments
   - Preserve original order (position)

### API Endpoints:
```typescript
POST /api/scraper/scrape-year   // Scrape specific year
GET  /api/scraper/status/:jobId  // Check scraping progress
```

### Testing:
- Manually test with one show first
- Verify all track info extracted correctly
- Check audio URL detection works

---

## Phase 3: Audio Processing (Week 3)

### Goal: Download and convert to OGG Vorbis

### Implementation:

1. **Download Service** (`backend/src/audio/download.service.ts`)
   ```typescript
   async downloadShow(show: Show): Promise<string> {
     // Download from archiveUrl
     // Save to storage/raw/
     // Return file path
   }
   ```

2. **Conversion Service** (`backend/src/audio/converter.service.ts`)
   ```typescript
   async convertToOgg(inputPath: string): Promise<string> {
     // Use FFmpeg to convert any format → OGG Vorbis
     // Quality: -q:a 6 (roughly 192kbps equivalent)
     // Save to storage/converted/{showId}.ogg
     // Return file path
   }
   ```

3. **FFmpeg Commands**:
   ```bash
   # RealAudio → OGG
   ffmpeg -i input.ra -c:a libvorbis -q:a 6 output.ogg
   
   # MP3 → OGG (if we want to standardize)
   ffmpeg -i input.mp3 -c:a libvorbis -q:a 6 output.ogg
   
   # Or just keep MP3 if already high quality
   # (can decide per-file based on source quality)
   ```

4. **Processing Queue** (BullMQ)
   - Job: Download → Convert → Update DB
   - Progress tracking
   - Error handling & retry logic

### API Endpoints:
```typescript
POST /api/shows/:id/process     // Start processing
GET  /api/shows/:id/status      // Check progress
```

### Storage Strategy:
```
storage/
├── raw/              # Downloaded files (delete after conversion)
│   └── {showId}.{ext}
└── converted/        # OGG Vorbis files (keep)
    └── {showId}.ogg
```

---

## Phase 4: Backend API (Week 4)

### Goal: RESTful API for shows and tracks

### Modules:

#### 1. Shows Module (`backend/src/shows/`)

**Endpoints:**
```typescript
GET    /api/shows              // List all shows (2020)
GET    /api/shows/:id          // Show details with tracks
POST   /api/shows/:id/process  // Trigger audio processing
GET    /api/shows/:id/stream   // Stream audio file
```

**Features:**
- Pagination (20 per page)
- Sort by date
- Filter by processed status
- Include track count

#### 2. Tracks Module (`backend/src/tracks/`)

**Endpoints:**
```typescript
GET    /api/tracks             // List all tracks
GET    /api/tracks/:id         // Track details
GET    /api/tracks/search      // Search by artist/title
```

**Features:**
- Search with query string
- Filter by show
- Pagination

#### 3. Audio Streaming

**Implementation:**
- Range requests for seeking
- Proper MIME types
- Cache headers

```typescript
@Get('shows/:id/stream')
async streamAudio(@Param('id') id: string, @Res() res: Response) {
  // Read OGG file
  // Set headers: Content-Type: audio/ogg
  // Support range requests
  // Stream to response
}
```

---

## Phase 5: Frontend (Week 5-6)

### Goal: Browse shows and play audio

### Pages:

#### 1. Dashboard (`/`)
```typescript
- Total shows scraped
- Total tracks found
- Processing status
- Recent shows
- Quick actions (Scrape 2020, Process All)
```

#### 2. Shows List (`/shows`)
```typescript
- Chronological list of 2020 shows
- Each show card:
  - Date & title
  - Track count
  - Audio status (pending/processing/ready)
  - Play button (if ready)
  - Process button (if not processed)
- Sort & filter options
```

#### 3. Show Detail (`/shows/[id]`)
```typescript
- Show metadata (date, duration)
- Full tracklist in order:
  - Position #
  - Artist - Title
  - Album (Label, Year)
- Audio player for full show
- Timestamps for reference (even if not split)
```

#### 4. Tracks Browser (`/tracks`)
```typescript
- Searchable list of all tracks
- Filters:
  - Artist
  - Year
  - Show date
- Click to go to show detail
- Shows which show each track is from
```

#### 5. Admin Panel (`/admin`)
```typescript
- Scrape controls:
  - Button: "Scrape 2020 Shows"
  - Button: "Process All Unprocessed"
- Job queue status
- System stats (storage used, etc.)
- Manual show processing
```

### Components:

#### Global Audio Player
```typescript
// Fixed at bottom of screen
// Controls: Play/Pause, Seek, Volume
// Shows: Current show title & date
// Waveform (optional but cool for learning)
```

#### ShowCard
```typescript
interface ShowCardProps {
  show: Show;
  onPlay: () => void;
  onProcess: () => void;
}
// Displays show info and actions
```

#### TrackList
```typescript
interface TrackListProps {
  tracks: Track[];
  showTitle?: boolean; // Show which show it's from
}
// Table/list of tracks with metadata
```

### Tech Stack:
- **Next.js 14** with App Router
- **TailwindCSS** for styling
- **shadcn/ui** for components (optional but nice)
- **React Query** for data fetching
- **Howler.js** or HTML5 Audio for playback

---

## Implementation Order

### Week 1: Foundation
```bash
Day 1-2: Set up monorepo, Docker, Prisma
Day 3-4: Create basic Nest.js modules
Day 5-7: Create basic Next.js pages (mock data)
```

### Week 2: Scraping
```bash
Day 1-3: Build scraper service
Day 4-5: Test with real WFMU data
Day 6-7: Store shows & tracks in database
```

### Week 3: Audio Processing
```bash
Day 1-2: Download service
Day 3-4: FFmpeg conversion to OGG
Day 5-7: Queue system & testing
```

### Week 4: Backend API
```bash
Day 1-3: Shows & tracks endpoints
Day 4-5: Audio streaming
Day 6-7: Testing & refinement
```

### Week 5-6: Frontend
```bash
Week 5: Build all pages with real API
Week 6: Audio player & polish
```

---

## Testing Strategy

### Manual Testing Checklist:
- [ ] Scrape 2020 shows successfully
- [ ] All show metadata saved
- [ ] Track info parsed correctly
- [ ] Download show audio
- [ ] Convert to OGG successfully
- [ ] Stream audio in browser
- [ ] Search tracks works
- [ ] Browse shows by date
- [ ] No crashes or errors

### Example Test Show:
Pick one show from 2020, test end-to-end:
1. Scrape it
2. Download audio
3. Convert to OGG
4. View in UI
5. Play audio

---

## Storage Estimates (2020 Only)

**Assumptions:**
- ~50 shows in 2020
- ~2 hours per show
- OGG Vorbis quality 6 (~192kbps equivalent)

**Calculation:**
- 50 shows × 2 hours × 192kbps ÷ 8 = ~8.6 GB

**Total Storage Needed:** ~10-15GB (with some buffer)

**Much more manageable than 200GB!**

---

## Future Enhancements (Post-MVP)

Once MVP is working, we can add:

### Phase 2 Features:
1. **Track Splitting**
   - Use stored track metadata
   - Split OGG files at estimated timestamps
   - Save individual track files

2. **Genre Tagging**
   - Integrate MusicBrainz
   - Tag individual tracks
   - Browse by genre

3. **Playlists**
   - Create custom playlists
   - Mix tracks from different shows
   - Export functionality

4. **More Years**
   - Expand to 2019, 2021, etc.
   - Eventually full archive

5. **Advanced Features**
   - Waveform visualization
   - Download/export shows
   - Mobile-responsive design
   - Keyboard shortcuts

---

## Learning Goals

This project touches on:

### Backend:
- [x] **Nest.js** - Modular architecture, dependency injection
- [x] **Prisma** - Database ORM, migrations
- [x] **BullMQ** - Background job processing
- [x] **FFmpeg** - Audio manipulation
- [x] **Web Scraping** - HTML parsing
- [x] **Streaming** - Range requests, large files

### Frontend:
- [x] **Next.js 14** - App Router, Server Components
- [x] **React** - Modern patterns, hooks
- [x] **TypeScript** - Type safety end-to-end
- [x] **Audio APIs** - Web Audio API or libraries
- [x] **State Management** - Client-side caching

### DevOps:
- [x] **Docker** - Containerization
- [x] **PostgreSQL** - Relational database
- [x] **Redis** - Queue management
- [x] **Monorepo** - npm workspaces

### Best Practices:
- [x] **API Design** - RESTful principles
- [x] **Error Handling** - Graceful failures
- [x] **Testing** - Unit & integration tests
- [x] **Documentation** - Clear, maintainable

---

## Success Criteria

MVP is complete when:
1. ✅ Can scrape all 2020 shows (metadata + tracks)
2. ✅ Can download and convert any show to OGG
3. ✅ Can browse all shows in web UI
4. ✅ Can search tracks by artist/title
5. ✅ Can play full show audio in browser
6. ✅ Can see tracklist for any show
7. ✅ System is stable and documented

---

## Next Immediate Steps

1. Initialize backend with Nest.js CLI
2. Set up Prisma with simplified schema
3. Initialize frontend with create-next-app
4. Set up Docker containers
5. Create first scraper endpoint
6. Test with one 2020 show

Ready to start implementing? 🚀

