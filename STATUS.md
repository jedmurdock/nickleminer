# Project Status

**Last Updated:** January 27, 2025  
**Current Phase:** MVP Core Features Complete ✅

---

## 🎯 What's Been Built

### ✅ Phase 1: Foundation (COMPLETE)

#### Project Structure
- [x] Monorepo setup with npm workspaces
- [x] Rancher Desktop + Docker Compose infrastructure (PostgreSQL, Redis, MinIO)
- [x] Git repository initialized
- [x] Comprehensive documentation created

#### Backend (Nest.js)
- [x] Nest.js application initialized
- [x] TypeScript configured
- [x] Prisma ORM integrated
- [x] Database schema defined (Shows & Tracks tables)
- [x] ConfigModule for environment variables
- [x] CORS enabled for frontend communication
- [x] PrismaService with connection management

#### Frontend (Next.js)
- [x] Next.js 15 with App Router
- [x] TypeScript configured
- [x] TailwindCSS for styling
- [x] ESLint configured
- [x] Basic layout and home page
- [x] Admin dashboard (`/admin`)
- [x] Environment variables setup

#### Database Schema
```prisma
✅ Show model (id, date, title, playlistUrl, archiveUrl, audioFormat, audioPath, duration, processed)
✅ Track model (id, showId, position, artist, title, album, label, year, comments)
✅ Relationships (Show -> Tracks one-to-many)
✅ Indexes on key fields
```

---

### ✅ Phase 2: Web Scraping (COMPLETE)

#### Scraper Service
- [x] ScraperModule created
- [x] ScraperService with comprehensive logic:
  - [x] Fetch WFMU playlist index
  - [x] Filter shows by year (focused on 2020)
  - [x] Parse HTML with Cheerio
  - [x] Detect available audio formats (MP3, OGG, AAC, RealAudio)
  - [x] **Format prioritization: OGG > AAC/M4A > MP3 > RealAudio** ✨
  - [x] Extract track listings from HTML tables/divs
  - [x] Parse track metadata (artist, title, album, label, year)
  - [x] Rate limiting (2 second delay between requests)
  - [x] Duplicate detection
  
#### API Endpoints
- [x] `POST /scraper/scrape-year` - Trigger scraping for a specific year
- [x] `GET /scraper/shows` - List all scraped shows (with pagination)
- [x] `GET /scraper/shows/:id` - Get show details with tracks

---

### ✅ Phase 3: Audio Processing (COMPLETE)

#### Audio Module
- [x] Audio download service - Downloads archives to `storage/raw`
- [x] Audio conversion service - Converts to OGG Vorbis (`ffmpeg -q:a 6`) in `storage/converted`
- [x] Storage management - Persists raw/converted paths, timestamps, processing state
- [x] BullMQ job queue integration - Background processing via `POST /scraper/shows/:id/process`

#### Features
- [x] Download audio files from archive URLs
- [x] Format conversion to OGG Vorbis
- [x] Processing state tracking
- [x] Skip already processed files

---

### ✅ Phase 4: Audio Streaming (COMPLETE)

#### Streaming Module
- [x] `GET /shows/:id/stream` - Serves converted audio with HTTP range support
- [x] Falls back to raw archive if converted copy missing
- [x] Proper MIME type handling
- [x] Range request support for seeking

---

### ✅ Phase 5: Admin UI (COMPLETE)

#### Frontend Admin Dashboard
- [x] Admin dashboard at `/admin`
- [x] Trigger year-based scraping
- [x] Display show list with metadata (format, processed status, track count)
- [x] Kick off audio conversion for each show
- [x] Surface job status messages in UI

---

## 📊 Current Capabilities

### ✅ What Works Right Now:

1. **Scrape WFMU shows** for any year (default 2020)
2. **View all scraped shows** via API or admin UI
3. **See track listings** for each show
4. **Check audio format availability** (OGG, AAC/M4A, MP3, or RealAudio)
5. **Download and convert audio** to OGG format
6. **Stream audio** via `/shows/:id/stream` endpoint
7. **Admin dashboard** for managing scraping and processing
8. **Inspect database** with Prisma Studio

---

## ⏳ In Progress / Next Steps

### Phase 6: User-Facing UI (In Progress)

- [ ] `/shows` list page
- [ ] `/shows/[id]` detail page with embedded player
- [ ] `/tracks` explorer with search/filter
- [ ] Global audio player component

---

## 🚧 Deferred (Post-MVP)

- [ ] Track splitting (timestamp + silence hybrid)
- [ ] Genre tagging (MusicBrainz/Last.fm/AcoustID)
- [ ] Advanced search
- [ ] Custom playlists
- [ ] Playlist exports (M3U, JSON)
- [ ] Expanding scraping beyond 2020

---

## 📈 Progress Tracker

### Overall Progress: ~70%

| Phase | Status | Progress |
|-------|--------|----------|
| Foundation | ✅ Complete | 100% |
| Web Scraping | ✅ Complete | 100% |
| Audio Processing | ✅ Complete | 100% |
| Audio Streaming | ✅ Complete | 100% |
| Admin UI | ✅ Complete | 100% |
| User-Facing UI | ⏳ In Progress | 30% |
| Testing & Polish | ⏳ Pending | 0% |

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# Root
npm install

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Start Infrastructure
```bash
# Launch Rancher Desktop (dockerd runtime), then:
docker compose up -d
```

### 3. Configure Backend
```bash
cd backend
cat > .env << 'EOF'
DATABASE_URL="postgresql://nickleminer:nickleminer_dev_password@localhost:5432/nickleminer"
REDIS_HOST="localhost"
REDIS_PORT=6379
STORAGE_PATH="../storage"
FFMPEG_PATH="/usr/local/bin/ffmpeg"
PORT=3001
CORS_ORIGIN="http://localhost:3000"
EOF

npm run prisma:generate
npm run prisma:migrate
```

### 4. Start Services
```bash
# Backend (terminal 1)
cd backend && npm run start:dev

# Frontend (terminal 2)
cd frontend && npm run dev
```

### 5. Access the Application
- **Frontend:** http://localhost:3000
- **Admin Dashboard:** http://localhost:3000/admin
- **Backend API:** http://localhost:3001
- **Prisma Studio:** `cd backend && npm run prisma:studio` → http://localhost:5555

---

## 📝 Example API Usage

### Scrape Shows
```bash
POST http://localhost:3001/scraper/scrape-year
Content-Type: application/json

{
  "year": 2020
}
```

### List Shows (with pagination)
```bash
GET http://localhost:3001/scraper/shows?page=1&limit=20
```

### Process Audio for a Show
```bash
POST http://localhost:3001/scraper/shows/:id/process
```

### Stream Audio
```bash
GET http://localhost:3001/shows/:id/stream
# Or use in browser: <audio src="http://localhost:3001/shows/:id/stream" />
```

---

## 🛠️ Development Workflow

### Daily Workflow
```bash
# Start infrastructure (if not running)
docker compose up -d

# Start backend
cd backend && npm run start:dev

# Start frontend (separate terminal)
cd frontend && npm run dev

# View database
cd backend && npm run prisma:studio
```

### When Pulling Updates
```bash
# Install new dependencies
npm install
cd backend && npm install
cd frontend && npm install

# Update database schema
cd backend
npm run prisma:generate
npm run prisma:migrate
```

---

## 📁 Key Files

**Backend:**
- `backend/src/main.ts` - Application entry point
- `backend/src/app.module.ts` - Main module
- `backend/src/scraper/` - Scraping service and controller
- `backend/src/audio/` - Audio download and conversion services
- `backend/src/shows/` - Streaming controller
- `backend/prisma/schema.prisma` - Database schema

**Frontend:**
- `frontend/app/page.tsx` - Home page
- `frontend/app/admin/page.tsx` - Admin dashboard
- `frontend/app/layout.tsx` - Root layout
- `frontend/lib/api.ts` - API client

**Infrastructure:**
- `docker-compose.yml` - Container orchestration
- `storage/raw/` - Downloaded audio files
- `storage/converted/` - Converted OGG files

---

## 🎯 MVP Scope

**Goal:** Archive 2020 WFMU shows for personal use and learning

### ✅ Completed:
- [x] Scrape ~50 shows from 2020
- [x] Prefer higher quality audio formats (OGG > AAC > MP3 > RA)
- [x] Download and convert to OGG Vorbis
- [x] Store full shows (no track splitting yet)
- [x] Store track metadata from HTML
- [x] Admin UI to browse and process shows
- [x] Stream audio in browser

### ⏳ In Progress:
- [ ] User-facing shows/tracks browsing pages
- [ ] Embedded audio player

### ❌ Deferred:
- [ ] Track splitting into individual files
- [ ] Genre tagging
- [ ] Advanced search
- [ ] Custom playlists

---

## 📞 Quick Reference

### Ports
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Prisma Studio: http://localhost:5555
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- MinIO Console: http://localhost:9001

### Common Commands
```bash
# Start everything
docker compose up -d
cd backend && npm run start:dev
cd frontend && npm run dev

# View database
cd backend && npm run prisma:studio

# Stop everything
docker compose down
```

---

## 🎉 Current State

The MVP core is **complete and functional**. You can:
- ✅ Scrape shows from WFMU
- ✅ Download and convert audio
- ✅ Stream audio files
- ✅ Manage everything via admin UI

**Next focus:** Build user-facing browsing and playback experience! 🎵
