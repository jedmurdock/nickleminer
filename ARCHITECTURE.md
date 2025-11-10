# System Architecture

## Overview Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Next.js Frontend                         │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌───────────────┐  │
│  │Dashboard │  │  Tracks   │  │ Playlists│  │ Audio Player  │  │
│  │          │  │  Browser  │  │ Manager  │  │  (Global)     │  │
│  └──────────┘  └───────────┘  └──────────┘  └───────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/REST
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Nest.js Backend                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      REST API                             │   │
│  │  /api/shows  /api/tracks  /api/playlists  /api/genres   │   │
│  └────────────┬──────────────┬──────────────┬────────────────┘  │
│               │              │              │                    │
│  ┌────────────▼───┐  ┌──────▼──────┐  ┌───▼─────────┐          │
│  │  Shows Service │  │Tracks Service│  │Genre Service│          │
│  │                │  │              │  │             │          │
│  └────────────────┘  └──────────────┘  └─────────────┘          │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │               Background Job Queues (BullMQ)             │   │
│  │                                                           │   │
│  │  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌────────┐ │   │
│  │  │ Scraper  │→ │  Audio    │→ │  Audio   │→ │ Genre  │ │   │
│  │  │  Queue   │  │ Download  │  │ Splitter │  │ Tagger │ │   │
│  │  │          │  │  Queue    │  │  Queue   │  │ Queue  │ │   │
│  │  └──────────┘  └───────────┘  └──────────┘  └────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │               External API Integrations                   │   │
│  │                                                           │   │
│  │  ┌────────────┐  ┌──────────┐  ┌─────────────────────┐  │   │
│  │  │ MusicBrainz│  │ Last.fm  │  │  AcoustID           │  │   │
│  │  │  Service   │  │ Service  │  │  (Fingerprinting)   │  │   │
│  │  └────────────┘  └──────────┘  └─────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────┬──────────────────────┬────────────────────────────┘
             │                      │
             ▼                      ▼
┌────────────────────┐    ┌─────────────────┐
│   PostgreSQL       │    │     Redis       │
│   ┌──────────┐     │    │  ┌──────────┐   │
│   │  shows   │     │    │  │Job Queues│   │
│   │  tracks  │     │    │  │          │   │
│   │  genres  │     │    │  │  Cache   │   │
│   │ playlists│     │    │  └──────────┘   │
│   └──────────┘     │    └─────────────────┘
└────────────────────┘
             ▲
             │
             ▼
┌────────────────────────────────────────┐
│      File Storage / MinIO              │
│  ┌─────────┐  ┌──────────┐  ┌───────┐ │
│  │   raw/  │→ │converted/│→ │tracks/│ │
│  │ .ra/.rm │  │  .mp3    │  │ .mp3  │ │
│  └─────────┘  └──────────┘  └───────┘ │
└────────────────────────────────────────┘
```

---

## Data Flow

### 1. Scraping Flow
```
1. User triggers scrape in Admin UI
2. Frontend → POST /api/shows/scrape
3. Nest.js adds job to Scraper Queue
4. Worker fetches WFMU index page
5. Parses each show date/link
6. Saves show metadata to PostgreSQL
7. For each show, fetches playlist page
8. Parses track listings
9. Saves tracks (without audio) to PostgreSQL
10. Returns job completion status
```

### 2. Audio Processing Flow
```
1. User selects show to process
2. Frontend → POST /api/shows/:id/process
3. Nest.js adds job to Audio Download Queue
4. Worker downloads RealAudio file
5. Saves to storage/raw/
6. Job moves to Audio Conversion Queue
7. FFmpeg converts .ra → .mp3
8. Saves to storage/converted/
9. Job moves to Audio Splitter Queue
10. Reads track timestamps from database
11. Splits show MP3 into individual tracks
12. Saves to storage/tracks/
13. Updates track records with audio_path
14. Job moves to Genre Tagger Queue
15. Generates acoustic fingerprint
16. Queries MusicBrainz/Last.fm APIs
17. Saves genres to database
18. Job complete ✓
```

### 3. Playback Flow
```
1. User clicks play on track
2. Frontend → GET /api/tracks/:id/audio
3. Nest.js streams MP3 from storage
4. Audio player receives bytes
5. Plays in browser
6. User adds to playlist
7. Frontend → POST /api/playlists/:id/tracks
8. Updates playlist_tracks table
```

---

## Component Details

### Backend Services

#### Scraper Service
**Responsibilities:**
- Fetch WFMU playlist pages
- Parse HTML for show metadata
- Parse HTML for track listings
- Handle pagination
- Error handling & retries

**Key Methods:**
- `scrapeIndex()` - Get all shows from index page
- `scrapePlaylist(url)` - Get tracks from specific show
- `parseTrackRow(html)` - Extract track info from HTML

#### Audio Service
**Responsibilities:**
- Download audio files
- Convert formats using FFmpeg
- Split into individual tracks
- Manage storage

**Key Methods:**
- `downloadArchive(url)` - Download RealAudio file
- `convertToMp3(inputPath)` - Convert using FFmpeg
- `splitByTimestamps(mp3Path, tracks)` - Split show
- `detectSilence(mp3Path)` - Fallback splitting method

#### Tagging Service
**Responsibilities:**
- Generate acoustic fingerprints
- Query music databases
- Normalize genre names
- Calculate confidence scores

**Key Methods:**
- `identifyTrack(audioPath)` - Use AcoustID
- `fetchGenres(musicBrainzId)` - Get genres
- `normalizeGenre(rawGenre)` - Standardize names
- `tagTrack(trackId)` - Complete tagging process

### Frontend Components

#### AudioPlayer (Global)
**Features:**
- Persistent playback across pages
- Queue management
- Shuffle/repeat modes
- Volume control
- Seek bar with progress
- Now playing display

**State:**
- currentTrack
- queue
- isPlaying
- volume
- repeatMode

#### TrackCard
**Props:**
- track (object)
- onPlay (function)
- onAddToPlaylist (function)

**Display:**
- Track title & artist
- Album art (if available)
- Duration
- Genre tags
- Play button
- Add to playlist button

#### PlaylistBuilder
**Features:**
- Drag-and-drop reordering
- Add/remove tracks
- Save/load playlists
- Export to M3U/JSON

---

## Database Indexes

### Performance Optimization

```sql
-- Shows
CREATE INDEX idx_shows_date ON shows(date DESC);
CREATE INDEX idx_shows_processed ON shows(processed);

-- Tracks
CREATE INDEX idx_tracks_show_id ON tracks(show_id);
CREATE INDEX idx_tracks_artist ON tracks(artist);
CREATE INDEX idx_tracks_title ON tracks(title);
CREATE INDEX idx_tracks_year ON tracks(year);
CREATE FULLTEXT INDEX idx_tracks_search ON tracks(title, artist, album);

-- Genres
CREATE INDEX idx_genres_name ON genres(name);

-- Track-Genre relationships
CREATE INDEX idx_track_genres_track ON track_genres(track_id);
CREATE INDEX idx_track_genres_genre ON track_genres(genre_id);
CREATE INDEX idx_track_genres_confidence ON track_genres(confidence);

-- Playlists
CREATE INDEX idx_playlist_tracks_playlist ON playlist_tracks(playlist_id);
CREATE INDEX idx_playlist_tracks_position ON playlist_tracks(position);
```

---

## API Endpoints

### Shows
- `GET /api/shows` - List all shows (paginated)
  - Query params: ?page=1&limit=20&year=2010
- `GET /api/shows/:id` - Get show details with tracks
- `POST /api/shows/scrape` - Trigger scraping job
- `POST /api/shows/:id/process` - Process audio for show
- `GET /api/shows/:id/status` - Get processing status

### Tracks
- `GET /api/tracks` - List/search tracks (paginated)
  - Query params: ?search=funk&genre=soul&year=1975&page=1
- `GET /api/tracks/:id` - Get track details
- `GET /api/tracks/:id/audio` - Stream audio file
- `PATCH /api/tracks/:id` - Update metadata
- `POST /api/tracks/:id/genres` - Add genre tag
- `DELETE /api/tracks/:id/genres/:genreId` - Remove genre tag

### Genres
- `GET /api/genres` - List all genres with track counts
- `GET /api/genres/:id` - Get genre details
- `GET /api/genres/:id/tracks` - Get tracks in genre
- `POST /api/genres` - Create new genre (admin)

### Playlists
- `GET /api/playlists` - List user playlists
- `GET /api/playlists/:id` - Get playlist with tracks
- `POST /api/playlists` - Create playlist
- `PATCH /api/playlists/:id` - Update playlist metadata
- `DELETE /api/playlists/:id` - Delete playlist
- `POST /api/playlists/:id/tracks` - Add track to playlist
- `DELETE /api/playlists/:id/tracks/:trackId` - Remove track
- `PATCH /api/playlists/:id/tracks/reorder` - Reorder tracks
- `GET /api/playlists/:id/export` - Export as M3U

### Jobs
- `GET /api/jobs` - List recent jobs
- `GET /api/jobs/:id` - Get job status and progress

---

## Environment Variables

### Backend (.env)
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/nickleminer"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379

# Storage
STORAGE_TYPE="local" # or "s3"
STORAGE_PATH="./storage"
S3_BUCKET="nickleminer"
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"

# FFmpeg
FFMPEG_PATH="/usr/local/bin/ffmpeg"

# External APIs
MUSICBRAINZ_USER_AGENT="NickleMiner/1.0 (your@email.com)"
LASTFM_API_KEY="your_key_here"
ACOUSTID_API_KEY="your_key_here"

# Rate Limiting
MUSICBRAINZ_RATE_LIMIT=1 # requests per second
LASTFM_RATE_LIMIT=5000 # requests per day

# Processing
MAX_CONCURRENT_DOWNLOADS=2
MAX_CONCURRENT_CONVERSIONS=4
MAX_CONCURRENT_SPLITS=4
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

---

## Security Considerations

1. **API Rate Limiting**: Implement rate limiting on all endpoints
2. **File Access Control**: Validate file paths to prevent directory traversal
3. **CORS**: Configure appropriate CORS policies
4. **Input Validation**: Sanitize all user inputs
5. **Authentication** (Future): Add JWT-based auth for multi-user support
6. **Storage Permissions**: Ensure storage directories have proper permissions

---

## Monitoring & Logging

### Logging Strategy
- Use structured logging (JSON format)
- Log levels: ERROR, WARN, INFO, DEBUG
- Include context: jobId, userId, trackId, etc.

### Metrics to Track
- Scraping: shows scraped, tracks found, errors
- Processing: conversion time, split accuracy, tagging success rate
- API: request count, response times, error rates
- Storage: total size, growth rate

### Health Checks
- Database connectivity
- Redis connectivity
- Storage availability
- FFmpeg availability
- External API health

---

## Testing Strategy

### Unit Tests
- Service methods
- Utility functions
- Data transformations

### Integration Tests
- API endpoints
- Database operations
- Queue processing

### E2E Tests
- Complete scraping flow
- Audio processing pipeline
- Playlist creation and playback

### Manual Testing Checklist
- [ ] Scrape one show successfully
- [ ] Download and convert audio
- [ ] Split tracks accurately
- [ ] Tag genres correctly
- [ ] Play track in browser
- [ ] Create and manage playlist
- [ ] Search and filter tracks

---

## Performance Targets

- **API Response Time**: < 200ms (median)
- **Search Results**: < 500ms
- **Audio Stream Start**: < 1s
- **Page Load Time**: < 2s
- **Scraping Speed**: ~20 shows/hour
- **Processing Speed**: ~2 shows/hour (with splitting & tagging)

---

## Scalability Considerations

### For Future Growth

1. **Horizontal Scaling**
   - Stateless API servers (multiple instances)
   - Separate worker processes for queues
   - Load balancer (nginx/HAProxy)

2. **Database Optimization**
   - Connection pooling
   - Read replicas for queries
   - Caching frequent queries in Redis

3. **Storage Optimization**
   - CDN for audio delivery
   - Compression for storage
   - Tiered storage (hot/cold)

4. **Caching Strategy**
   - Redis for API responses
   - Browser caching for static assets
   - Service worker for offline playback

---

## Deployment

### Development
```bash
docker-compose up -d  # Start PostgreSQL, Redis, MinIO
cd backend && npm run start:dev
cd frontend && npm run dev
```

### Production (Future)
- Docker containers for all services
- Kubernetes for orchestration
- CI/CD pipeline (GitHub Actions)
- Environment-specific configs
- Automated backups

---

## Maintenance

### Regular Tasks
- Database backups (daily)
- Log rotation (weekly)
- Storage cleanup (monthly)
- Dependency updates (monthly)
- Security patches (as needed)

### Monitoring Alerts
- Disk space > 80%
- Queue depth > 1000 jobs
- Error rate > 5%
- API response time > 1s
- External API failures

---

This architecture provides a solid foundation for building a scalable, maintainable music archival system. Let me know if you'd like to dive deeper into any component!

