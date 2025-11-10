# WFMU Nickel & Dime Radio Archive Project

## Project Overview
A full-stack application to scrape, archive, and manage tracks from WFMU's "Nickel And Dime Radio with $mall ¢hange" show, enabling custom playlist creation with genre-based tagging.

---

## System Architecture

### Technology Stack

#### Frontend
- **Next.js 14+** (App Router)
- **React 18+** with TypeScript
- **UI Libraries**: TailwindCSS, shadcn/ui, or Material-UI
- **Audio Player**: react-h5-audio-player or Howler.js
- **State Management**: React Context API or Zustand

#### Backend
- **Nest.js** (API server)
- **TypeScript**
- **Queue Management**: Bull/BullMQ (for background jobs)
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis (for job queues and caching)

#### Audio Processing
- **FFmpeg** (RealAudio → MP3 conversion)
- **Audio splitting**: FFmpeg with silence detection or playlist timestamps
- **Storage**: Local filesystem or S3-compatible storage (MinIO)

#### Web Scraping
- **Puppeteer** or **Cheerio** for HTML parsing
- **Axios** for HTTP requests

#### Music Metadata & Tagging
- **MusicBrainz API** (free, open-source music database)
- **AcoustID** (acoustic fingerprinting)
- **Last.fm API** (genre tags)
- **Spotify Web API** (optional, for additional metadata)

---

## Database Schema

### Tables

#### `shows`
```sql
id              UUID PRIMARY KEY
date            DATE NOT NULL
title           TEXT
duration        INTEGER (seconds)
playlist_url    TEXT UNIQUE
archive_url     TEXT
raw_audio_path  TEXT
processed       BOOLEAN DEFAULT false
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

#### `tracks`
```sql
id              UUID PRIMARY KEY
show_id         UUID REFERENCES shows(id)
title           TEXT NOT NULL
artist          TEXT NOT NULL
album           TEXT
label           TEXT
year            INTEGER
duration        INTEGER (seconds)
audio_path      TEXT
position        INTEGER (track order in show)
start_time      INTEGER (seconds from show start)
end_time        INTEGER (seconds from show start)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

#### `genres`
```sql
id              UUID PRIMARY KEY
name            TEXT UNIQUE NOT NULL
created_at      TIMESTAMP
```

#### `track_genres` (many-to-many)
```sql
track_id        UUID REFERENCES tracks(id)
genre_id        UUID REFERENCES genres(id)
confidence      FLOAT (0-1, tagging confidence)
source          TEXT (musicbrainz, lastfm, manual, etc.)
PRIMARY KEY (track_id, genre_id)
```

#### `playlists`
```sql
id              UUID PRIMARY KEY
name            TEXT NOT NULL
description     TEXT
user_id         TEXT (for future multi-user support)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

#### `playlist_tracks` (many-to-many)
```sql
playlist_id     UUID REFERENCES playlists(id)
track_id        UUID REFERENCES tracks(id)
position        INTEGER
added_at        TIMESTAMP
PRIMARY KEY (playlist_id, track_id)
```

---

## Implementation Phases

### Phase 1: Web Scraping Module

**Goal**: Extract show dates, playlist URLs, and archive links from WFMU

**Components**:
1. **Scraper Service** (Nest.js)
   - Fetch index page: https://wfmu.org/playlists/ND
   - Parse dates and links for each show
   - Follow playlist links to extract track listings
   - Store in `shows` table

2. **Playlist Parser**
   - Extract track information:
     - Artist
     - Title
     - Album
     - Label
     - Timestamp (if available)
   - Handle various playlist formats
   - Store in `tracks` table (without audio yet)

**Challenges**:
- HTML structure may vary across years
- Some playlists may be incomplete
- Need to respect rate limits

**Solution**:
- Implement robust HTML parsing with multiple selectors
- Add retry logic and error handling
- Use delays between requests

---

### Phase 2: Audio Download & Conversion

**Goal**: Download RealAudio files and convert to MP3

**Components**:
1. **Download Service**
   - Queue-based system (BullMQ)
   - Download archive files from URLs
   - Store raw files temporarily

2. **Conversion Service**
   - FFmpeg integration
   - RealAudio → MP3 conversion
   ```bash
   ffmpeg -i input.ra -acodec libmp3lame -b:a 192k output.mp3
   ```
   - Quality: 192kbps MP3 (good balance)
   - Alternative: OGG Vorbis for better quality/size ratio

**Challenges**:
- RealAudio is proprietary and old
- Some archives may be in different formats
- Large file sizes and processing time

**Solutions**:
- FFmpeg supports RealAudio if compiled with appropriate codecs
- Fallback to other formats if RealAudio fails
- Process in background with progress tracking
- Consider using lower bitrates (128kbps) to save space

---

### Phase 3: Audio Splitting

**Goal**: Split full show recordings into individual tracks

**Approaches**:

#### Option A: Timestamp-Based Splitting (Preferred if available)
- Use playlist timestamps from WFMU website
- Split using FFmpeg:
  ```bash
  ffmpeg -i show.mp3 -ss 00:05:30 -to 00:08:45 -c copy track.mp3
  ```
- Fast, accurate if timestamps are reliable

#### Option B: Silence Detection (Fallback)
- Use FFmpeg silence detection:
  ```bash
  ffmpeg -i show.mp3 -af silencedetect=n=-50dB:d=1 -f null -
  ```
- Split on detected silence periods
- Match against playlist track count
- Manual verification may be needed

#### Option C: Manual Timing + Pattern Recognition
- Calculate approximate track length from playlist
- Use silence detection to refine boundaries
- Store exact timestamps for future use

**Implementation**:
1. Try Option A first (check if playlists have timestamps)
2. Fall back to Option B for shows without timestamps
3. Store `start_time` and `end_time` in database
4. Quality control: verify track count matches playlist

---

### Phase 4: Genre Tagging & Music Identification

**Goal**: Automatically tag tracks with genres and verify metadata

**Services to Use**:

1. **AcoustID + MusicBrainz** (Primary)
   - Acoustic fingerprinting for track identification
   - Free and open-source
   - Process:
     ```
     1. Generate fingerprint using chromaprint
     2. Query AcoustID API
     3. Get MusicBrainz ID
     4. Fetch genres from MusicBrainz
     ```

2. **Last.fm API** (Secondary)
   - Rich genre/tag data
   - User-generated tags
   - Good for obscure tracks
   - Free tier: 5,000 calls/day

3. **Manual Tagging Interface**
   - For tracks not found in APIs
   - Bulk editing capabilities
   - Genre suggestions based on artist/label

**Genre Normalization**:
- Create master genre list
- Map various genre names to standard taxonomy
- Examples: "hip-hop" → "Hip Hop", "funk/soul" → ["Funk", "Soul"]

**Confidence Scoring**:
- High (0.9-1.0): MusicBrainz match with multiple sources
- Medium (0.6-0.9): Single API match
- Low (0.3-0.6): Inferred from artist/label
- Manual (1.0): User-assigned

---

### Phase 5: Backend API (Nest.js)

**Modules**:

1. **Shows Module**
   - GET /api/shows (list with filters)
   - GET /api/shows/:id (details)
   - POST /api/shows/scrape (trigger scraping)

2. **Tracks Module**
   - GET /api/tracks (search, filter by genre/artist/date)
   - GET /api/tracks/:id
   - PATCH /api/tracks/:id (update metadata/genres)
   - GET /api/tracks/:id/audio (stream audio)

3. **Genres Module**
   - GET /api/genres (list all)
   - GET /api/genres/:id/tracks
   - POST /api/genres (create new)

4. **Playlists Module**
   - GET /api/playlists (user's playlists)
   - POST /api/playlists (create)
   - PATCH /api/playlists/:id (update)
   - DELETE /api/playlists/:id
   - POST /api/playlists/:id/tracks (add track)
   - DELETE /api/playlists/:id/tracks/:trackId

5. **Jobs Module**
   - GET /api/jobs (monitor scraping/processing)
   - GET /api/jobs/:id (status)

**Features**:
- Pagination
- Full-text search (PostgreSQL FTS)
- Advanced filtering (genre combinations, date ranges)
- Audio streaming with range support

---

### Phase 6: Frontend (Next.js)

**Pages**:

1. **Dashboard** (`/`)
   - Recent shows
   - Processing status
   - Quick stats (total tracks, shows, genres)

2. **Shows Browser** (`/shows`)
   - Chronological list of all shows
   - Filter by year
   - Click to see tracklist

3. **Track Explorer** (`/tracks`)
   - Searchable, filterable track list
   - Genre filter chips
   - Artist/album/year filters
   - Sort options
   - Audio preview on hover
   - "Add to playlist" button

4. **Genre Browser** (`/genres`)
   - Genre tag cloud or grid
   - Click to see all tracks in genre
   - Genre statistics

5. **Playlist Manager** (`/playlists`)
   - Create/edit playlists
   - Drag-and-drop track ordering
   - Export options (M3U, JSON)
   - Continuous playback mode

6. **Player** (Global component)
   - Persistent audio player (bottom of screen)
   - Now playing info
   - Queue management
   - Shuffle/repeat

7. **Admin Panel** (`/admin`)
   - Trigger scraping jobs
   - Monitor processing status
   - Manual metadata editing
   - Bulk operations

**UI Components**:
- TrackCard: Display track with artwork, metadata
- AudioPlayer: Custom player with waveform
- GenreTag: Clickable genre chips
- PlaylistBuilder: Drag-and-drop interface
- SearchBar: Instant search with suggestions

---

## File Structure

```
nickleminer/
├── backend/                    # Nest.js API
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── shows/
│   │   │   ├── shows.module.ts
│   │   │   ├── shows.service.ts
│   │   │   ├── shows.controller.ts
│   │   │   └── dto/
│   │   ├── tracks/
│   │   ├── genres/
│   │   ├── playlists/
│   │   ├── scraper/
│   │   │   ├── scraper.service.ts
│   │   │   ├── playlist-parser.service.ts
│   │   │   └── scraper.processor.ts (Bull queue)
│   │   ├── audio/
│   │   │   ├── audio.service.ts
│   │   │   ├── converter.service.ts
│   │   │   ├── splitter.service.ts
│   │   │   └── audio.processor.ts
│   │   ├── tagging/
│   │   │   ├── tagging.service.ts
│   │   │   ├── musicbrainz.service.ts
│   │   │   ├── lastfm.service.ts
│   │   │   └── acoustid.service.ts
│   │   ├── database/
│   │   │   └── prisma/
│   │   │       └── schema.prisma
│   │   └── common/
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   # Next.js app
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Dashboard
│   │   ├── shows/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── tracks/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── genres/
│   │   ├── playlists/
│   │   └── admin/
│   ├── components/
│   │   ├── AudioPlayer/
│   │   ├── TrackCard/
│   │   ├── GenreTag/
│   │   ├── PlaylistBuilder/
│   │   └── SearchBar/
│   ├── lib/
│   │   ├── api.ts              # API client
│   │   └── utils.ts
│   ├── package.json
│   └── tsconfig.json
│
├── shared/                     # Shared types
│   └── types/
│       ├── show.types.ts
│       ├── track.types.ts
│       └── api.types.ts
│
├── storage/                    # Audio files (gitignored)
│   ├── raw/                    # Downloaded RealAudio
│   ├── converted/              # Full show MP3s
│   └── tracks/                 # Individual track files
│
├── docker-compose.yml          # PostgreSQL, Redis, MinIO
├── package.json                # Root workspace config
└── README.md
```

---

## Technical Considerations

### 1. Storage
- **Estimate**: 20+ years of weekly shows × ~2 hours/show = ~2,000 hours
- **Size**: At 192kbps MP3 ≈ 1.7MB/minute → ~200GB total
- **Solution**: 
  - Start with local storage
  - Use MinIO (S3-compatible) for production
  - Implement storage cleanup for raw files after processing

### 2. Processing Time
- **RealAudio download**: ~10-30 min per show (depends on connection)
- **Conversion**: ~5-10 min per show
- **Splitting**: ~2-5 min per show
- **Tagging**: ~1-2 sec per track × 15 tracks/show = ~30 sec
- **Total per show**: ~30-60 minutes

**Solution**: Background queue processing, process in batches overnight

### 3. Legal Considerations
- ⚠️ **Copyright**: WFMU archives are publicly accessible, but downloaded music may have copyright restrictions
- **Personal use**: Should be fine for personal archiving
- **Distribution**: Do NOT redistribute audio files
- **Recommendation**: 
  - Add terms of use
  - Keep project private or audio-free if open source
  - Focus on metadata management, not file sharing

### 4. API Rate Limits
- **MusicBrainz**: 1 request/second (50 requests/minute max)
- **Last.fm**: 5,000 requests/day (free tier)
- **Solution**: Implement rate limiting, request queuing, caching

### 5. Data Quality
- **Issue**: Playlist data may be inconsistent, incomplete, or have typos
- **Solution**:
  - Fuzzy matching for artist/track lookup
  - Manual review interface
  - Confidence scoring
  - Community corrections (future feature)

---

## Development Roadmap

### Sprint 1 (Week 1-2): Foundation
- [ ] Set up monorepo structure
- [ ] Initialize Nest.js backend
- [ ] Initialize Next.js frontend
- [ ] Set up PostgreSQL + Prisma
- [ ] Set up Redis + BullMQ
- [ ] Create basic database schema

### Sprint 2 (Week 3-4): Web Scraping
- [ ] Build WFMU scraper
- [ ] Parse playlist HTML
- [ ] Store shows and tracks (metadata only)
- [ ] Create admin interface to trigger scraping

### Sprint 3 (Week 5-6): Audio Processing
- [ ] Implement download service
- [ ] Set up FFmpeg integration
- [ ] Build RealAudio → MP3 converter
- [ ] Create queue system for processing

### Sprint 4 (Week 7-8): Track Splitting
- [ ] Implement timestamp-based splitting
- [ ] Add silence detection fallback
- [ ] Quality control checks
- [ ] Store split tracks

### Sprint 5 (Week 9-10): Music Tagging
- [ ] Integrate AcoustID/MusicBrainz
- [ ] Add Last.fm API
- [ ] Build genre normalization system
- [ ] Create manual tagging interface

### Sprint 6 (Week 11-12): Frontend Features
- [ ] Build track explorer
- [ ] Implement search and filters
- [ ] Create audio player component
- [ ] Add playlist management

### Sprint 7 (Week 13-14): Polish & Optimization
- [ ] Performance optimization
- [ ] UI/UX improvements
- [ ] Error handling
- [ ] Documentation

---

## MVP (Minimum Viable Product)

To get started quickly, focus on:

1. ✅ Scrape show metadata from WFMU
2. ✅ Parse track listings
3. ✅ Download ONE show's archive
4. ✅ Convert to MP3
5. ✅ Manual track splitting (mark timestamps)
6. ✅ Basic genre tagging (manual)
7. ✅ Simple frontend to browse and play tracks
8. ✅ Create basic playlists

**Defer for later**:
- Bulk processing of all archives
- Automatic track splitting
- Automatic genre detection
- Advanced search
- User authentication
- Export features

---

## Next Steps

1. **Review this plan** - Any questions or adjustments?
2. **Set up development environment** - Node.js, Docker, FFmpeg
3. **Initialize project structure** - Create monorepo with backend/frontend
4. **Start with Sprint 1** - Database and basic architecture

Would you like me to proceed with implementation, or would you like to discuss any part of this plan first?

