# NickleMiner 🎵

A full-stack application for archiving and browsing WFMU's "Nickel And Dime Radio with $mall ¢hange" show archives. The current MVP focuses on 2020 episodes and provides a workflow to scrape shows, download their audio archives, convert them to OGG, and stream them back through a lightweight UI.

---

## 🎯 Project Overview

NickleMiner scrapes playlists from [WFMU's Nickel And Dime Radio](https://wfmu.org/playlists/ND), downloads the archived shows, converts them to an open audio format, and exposes a simple way to trigger these jobs. It also exposes a streaming endpoint so the converted audio can be played directly in the browser.

### Key Features (Current MVP)

- 🔍 **Automated Web Scraping** – Extracts show metadata and track listings from WFMU
- ⬇️ **Archive Downloading** – Pulls archived shows and stores them locally
- 🔄 **Audio Conversion** – Converts source files (MP4/M4A/MP3) to OGG with FFmpeg
- 📡 **Streaming Endpoint** – Serves converted audio with HTTP range support
- 🛠️ **Admin Dashboard** – Trigger scraping and per-show processing from the browser
- 🧵 **BullMQ Job Queues** – Background workers manage scraping and audio processing

### Roadmap Highlights

- Track splitting and tagging (MusicBrainz/Last.fm/AcoustID)
- Advanced search, playlists, and richer UI views
- Background job queue with progress tracking
- Expand scraping to additional years in the archive

---

## 🏗️ Tech Stack

### Frontend
- **Next.js 15** (App Router)
- **TypeScript**
- **TailwindCSS**

### Backend
- **Nest.js 11**
- **TypeScript**
- **Prisma** (PostgreSQL)
- **FFmpeg** integration
- **BullMQ** for scraping/processing queues

### Infrastructure
- **PostgreSQL** – Show + track storage
- **Redis** – Ready for queues/caching (not yet leveraged)
- **Rancher Desktop** – Local container runtime (Docker-compatible)
- **MinIO** – Optional S3-compatible storage (not required for MVP)

### External APIs (future work)
- MusicBrainz, Last.fm, AcoustID

---

## 📚 Documentation

- **[PROJECT_PLAN.md](./PROJECT_PLAN.md)** – Original end-to-end plan (includes stretch goals)
- **[MVP_PLAN.md](./MVP_PLAN.md)** – Simplified scope we’re executing today
- **[STATUS.md](./STATUS.md)** – Progress tracker
- **[CURRENT_STATE.md](./CURRENT_STATE.md)** – Snapshot of what’s working now
- **[GETTING_STARTED.md](./GETTING_STARTED.md)** – Environment setup guide
- **[SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md)** – Step-by-step install/run
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** – Handy commands + endpoints

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Rancher Desktop (with `dockerd` runtime enabled)
- FFmpeg
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nickleminer
   ```

2. **Start infrastructure**
   - Launch Rancher Desktop and ensure `dockerd` is selected
   - Start containers:
     ```bash
     docker compose up -d
     ```

3. **Set up backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env  # or populate per SETUP_INSTRUCTIONS
   npm run prisma:generate
   npm run prisma:migrate
   npm run start:dev
   ```

4. **Set up frontend**
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   npm run dev
   ```

5. **Open your browser**
   - Frontend: http://localhost:3000
   - Admin dashboard: http://localhost:3000/admin
   - Backend API: http://localhost:3001
   - Prisma Studio: http://localhost:5555

---

## 📖 Usage

### Scraping Shows

1. Navigate to the Admin panel at http://localhost:3000/admin
2. Pick a year (defaults to 2020) and click **Scrape**
3. Watch the status message and refresh the shows list

### Processing Audio

1. From the Admin panel shows table, click **Process Audio** for a show
2. The backend downloads the archive and converts it to OGG
3. Converted files appear under `storage/raw/` and `storage/converted/`
4. Stream audio via `GET /shows/:id/stream`

### Streaming Audio Directly

```bash
curl http://localhost:3001/shows/<showId>/stream --output show.ogg
```

---

## 🗺️ Project Structure

```
nickleminer/
├── backend/
│   ├── src/
│   │   ├── audio/           # Download + conversion services
│   │   ├── scraper/         # Scrape playlists, store shows/tracks
│   │   ├── shows/           # Streaming controller
│   │   ├── database/        # Prisma service + module
│   │   └── main.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx         # Home links to Admin/Shows/Tracks
│   │   └── admin/           # Admin dashboard
│   ├── lib/
│   └── package.json
│
├── storage/
│   ├── raw/                 # Downloaded archives (gitignored)
│   └── converted/           # Converted OGG (gitignored)
│
├── docs/ (Markdown references)
└── docker-compose.yml
```

---

## 🔧 Development

### Running Tests

```bash
# Backend tests
d cd backend
npm test
npm run test:e2e
npm run test:cov

# Frontend (placeholder)
cd ../frontend
npm test  # configure as you add tests
```

### Linting & Formatting

```bash
npm run lint    # Executes linting via workspace scripts
npm run format  # Apply Prettier formatting (if configured)
```

---

## 📊 Database Schema (MVP)

Key tables currently in use:

- **shows** – date, playlist URL, archive URL, raw/converted paths, timestamps
- **tracks** – artist/title metadata parsed from WFMU playlists

Genre/tagging/playlist tables are planned but not part of the MVP schema yet.

---

## 🔄 Processing Pipeline (Current)

```
1. Scrape WFMU → 2. Download archive → 3. Convert to OGG → 4. Stream
```

Track splitting, tagging, and playlist management remain on the roadmap.

---

## 🎨 Features

### Currently Implemented
- Show scraping and metadata storage
- Archive download + OGG conversion
- Streaming endpoint with range support
- Admin dashboard (scrape/process/refresh)

### Planned Enhancements
- Track splitting & tagging
- Advanced search + filtering UI
- Playlists and custom mixes
- Background processing with progress tracking

---

## ⚖️ Legal & Ethics

- **Copyright:** The archived audio may be copyrighted. Use for personal archival only.
- **Respect WFMU:** Leave rate limiting enabled (2-second scrape delay) and avoid hammering their servers.
- **Distribution:** Do not redistribute downloaded audio files.

---

## 🤝 Contributing / Next Steps

- Build the `/shows` and `/tracks` pages to browse metadata and initiate streaming
- Integrate a frontend audio player that targets `/shows/:id/stream`
- Add background job monitoring (BullMQ + Redis)
- Expand to additional years once the MVP is stable

Built for personal use and a deeper understanding of the stack—enjoy exploring the Nickel & Dime archives! 🎧

