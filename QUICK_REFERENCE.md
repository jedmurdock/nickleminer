# Quick Reference Guide

Essential commands and information for the NickleMiner project (Current MVP State).

---

## 🚀 Common Commands

### First-Time Setup
```bash
# Install dependencies
cd /Users/jedmurdock/cursor/nickleminer
npm install
cd backend && npm install
cd ../frontend && npm install

# Start infrastructure (ensure Rancher Desktop with dockerd runtime is running)
docker compose up -d

# Set up database
cd backend
cat > .env << 'EOF'
DATABASE_URL="postgresql://nickleminer:nickleminer_dev_password@localhost:5432/nickleminer"
PORT=3001
CORS_ORIGIN="http://localhost:3000"
STORAGE_PATH="../storage"
FFMPEG_PATH="/usr/local/bin/ffmpeg"
EOF

npm run prisma:generate
npm run prisma:migrate  # Enter "init" when prompted
```

### Daily Development
```bash
# Ensure Rancher Desktop is running, then
docker compose up -d

# Start backend
cd backend && npm run start:dev

# Start frontend (in another terminal)
cd frontend && npm run dev
```

### Container Management (Rancher Desktop + Docker CLI)
```bash
docker compose up -d          # Start databases
docker compose down           # Stop databases
docker compose logs -f        # View logs
docker compose restart postgres  # Restart specific service
docker ps                     # List running containers
```

### Database Commands
```bash
cd backend

# View database in browser GUI
npm run prisma:studio

# Create new migration
npm run prisma:migrate

# Reset database (WARNING: deletes data!)
npx prisma migrate reset

# Generate Prisma client after schema changes
npm run prisma:generate
```

---

## 📍 Important URLs

### Development
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Prisma Studio**: http://localhost:5555

### Infrastructure
- **MinIO Console**: http://localhost:9001
  - Username: `minioadmin`
  - Password: `minioadmin`

### External Resources
- **WFMU Playlists**: https://wfmu.org/playlists/ND

---

## 📂 Current Project Structure

```
nickleminer/
├── backend/                  # Nest.js API (port 3001)
│   ├── src/
│   │   ├── database/        # ✅ Prisma service
│   │   ├── scraper/         # ✅ Web scraping service
│   │   ├── app.module.ts    # ✅ Main module
│   │   └── main.ts          # ✅ Entry point
│   ├── prisma/
│   │   └── schema.prisma    # ✅ Shows & Tracks models
│   ├── .env                 # ⚠️  Create this
│   └── package.json         # ✅
│
├── frontend/                 # Next.js app (port 3000)
│   ├── app/
│   │   ├── page.tsx         # ✅ Home page
│   │   ├── layout.tsx       # ✅ Root layout
│   │   └── globals.css      # ✅ Tailwind styles
│   ├── components/          # 📁 Empty (ready for use)
│   ├── lib/                 # 📁 Empty (ready for use)
│   ├── .env.local           # ⚠️  Create this
│   └── package.json         # ✅
│
├── storage/                  # Audio files (gitignored)
│   ├── raw/                 # 📁 For downloads
│   ├── converted/           # 📁 For OGG files
│   └── tracks/              # 📁 For split tracks (future)
│
├── docker-compose.yml        # ✅ PostgreSQL, Redis, MinIO
├── package.json              # ✅ Root workspace
└── [docs]                    # ✅ Comprehensive documentation
```

**Note**: Only `database/` and `scraper/` modules exist. Other modules (audio, genres, playlists) are planned but not yet implemented.

---

## 🔑 Environment Variables

### Backend `.env` (REQUIRED)
```bash
# Create this file in backend/
DATABASE_URL="postgresql://nickleminer:nickleminer_dev_password@localhost:5432/nickleminer"
PORT=3001
CORS_ORIGIN="http://localhost:3000"
STORAGE_PATH="../storage"
FFMPEG_PATH="/usr/local/bin/ffmpeg"
```

**Note**: Adjust `FFMPEG_PATH` based on your system:
- macOS Intel: `/usr/local/bin/ffmpeg`
- macOS Apple Silicon: `/opt/homebrew/bin/ffmpeg`
- Linux: `/usr/bin/ffmpeg`

Find yours: `which ffmpeg`

### Frontend `.env.local` (Optional for now)
```bash
# Create this file in frontend/
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

---

## 📊 Current Database Schema (MVP)

### Tables Implemented:

**shows**
- `id` (UUID)
- `date` (DateTime)
- `title` (String, optional)
- `playlist_url` (String, unique)
- `archive_url` (String, optional)
- `audio_format` (String, optional) - 'mp3', 'ogg', 'aac', 'ra'
- `audio_path` (String, optional) - Path to converted OGG file
- `duration` (Int, optional) - Seconds
- `processed` (Boolean) - default false
- `created_at`, `updated_at` (DateTime)

**tracks**
- `id` (UUID)
- `show_id` (UUID, FK → shows)
- `position` (Int) - Order in playlist
- `artist` (String)
- `title` (String)
- `album` (String, optional)
- `label` (String, optional)
- `year` (Int, optional)
- `comments` (String, optional)
- `created_at` (DateTime)

**Deferred**: genres, playlists, track_genres, playlist_tracks (not in MVP)

---

## 🎯 Current API Endpoints

### Scraper Module (✅ Implemented)
```bash
# Scrape shows from a specific year
POST /scraper/scrape-year
Body: { "year": 2020 }

# List all scraped shows
GET /scraper/shows

# Get show details with tracks
GET /scraper/shows/:id
```

### Not Yet Implemented (⏳ Coming)
- Audio processing endpoints
- Streaming endpoints
- Admin endpoints
- Track search endpoints

---

## 🎵 Current Workflow (MVP)

### What You Can Do Now:

**1. Scrape 2020 Shows**
```bash
curl -X POST http://localhost:3001/scraper/scrape-year \
  -H "Content-Type: application/json" \
  -d '{"year": 2020}'
```

**2. View Scraped Shows**
```bash
# List all shows
curl http://localhost:3001/scraper/shows

# Or with jq for pretty output
curl http://localhost:3001/scraper/shows | jq
```

**3. Get Show Details**
```bash
curl http://localhost:3001/scraper/shows/[show-id] | jq
```

**4. Inspect Database**
```bash
cd backend
npm run prisma:studio
# Opens http://localhost:5555
```

### What's NOT Ready Yet:
- ❌ Downloading audio files
- ❌ Converting to OGG
- ❌ Streaming audio
- ❌ Frontend UI (basic page only)
- ❌ Track splitting
- ❌ Genre tagging
- ❌ Playlists

---

## 🛠️ Troubleshooting

### "Cannot connect to database"
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart PostgreSQL
docker compose restart postgres

# View logs
docker logs nickleminer-postgres

# If still broken, recreate
docker compose down
docker compose up -d
```

### "Module not found" errors
```bash
# Reinstall backend dependencies
cd backend
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma client
npm run prisma:generate
```

### "Prisma schema out of sync"
```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

### "FFmpeg not found"
```bash
# Check FFmpeg installation
which ffmpeg
ffmpeg -version

# Install if missing
brew install ffmpeg  # macOS
sudo apt install ffmpeg  # Linux

# Update .env with correct path
```

### "Port already in use"
```bash
# Find process using port
lsof -i :3000  # or :3001

# Kill process
kill -9 <PID>
```

### "Scraper returns empty results"
```bash
# WFMU's HTML structure may have changed
# Check the scraper logic in:
# backend/src/scraper/scraper.service.ts

# Test manually:
curl https://wfmu.org/playlists/ND
```

---

## 🔍 Useful SQL Queries

```sql
-- Count shows by year
SELECT EXTRACT(YEAR FROM date) as year, COUNT(*) 
FROM shows
GROUP BY year
ORDER BY year DESC;

-- Count tracks per show
SELECT s.date, s.title, COUNT(t.id) as track_count
FROM shows s
LEFT JOIN tracks t ON s.id = t.show_id
GROUP BY s.id
ORDER BY s.date DESC;

-- Find shows without audio URLs
SELECT date, title, playlist_url
FROM shows
WHERE archive_url IS NULL;

-- List all unique artists (top 20)
SELECT artist, COUNT(*) as appearances
FROM tracks
GROUP BY artist
ORDER BY COUNT(*) DESC
LIMIT 20;

-- Shows by audio format
SELECT audio_format, COUNT(*) as count
FROM shows
WHERE audio_format IS NOT NULL
GROUP BY audio_format;
```

---

## 📦 Scraper Features

### What It Does:
- ✅ Fetches WFMU playlist index page
- ✅ Filters shows by year (default: 2020)
- ✅ Detects available audio formats from page
- ✅ **Prioritizes: MP3 > OGG > AAC > RealAudio**
- ✅ Extracts track metadata (artist, title, album, label, year)
- ✅ Stores shows and tracks in database
- ✅ Prevents duplicates
- ✅ Rate limiting (2 second delay between requests)
- ✅ Error handling and logging

### Limitations:
- Depends on WFMU's HTML structure (may break if they update their site)
- Track parsing works with table-based layouts (most common)
- Some shows may have incomplete metadata
- Audio URLs may not always be detected

---

## 🧪 Testing Checklist

### Currently Testable:
- [x] Start Rancher Desktop containers
- [x] Run database migrations
- [x] Start backend server
- [x] Scrape 2020 shows
- [x] View shows in database
- [x] View tracks in database
- [x] Check audio format detection

### Not Yet Testable:
- [ ] Download audio files
- [ ] Convert to OGG
- [ ] Stream audio in browser
- [ ] Frontend UI functionality

---

## 📚 Documentation Files

- **[STATUS.md](./STATUS.md)** - ⭐ Start here! Complete current state and progress tracker
- **[MVP_PLAN.md](./MVP_PLAN.md)** - Simplified MVP scope
- **[SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md)** - Step-by-step setup
- **[PROJECT_PLAN.md](./PROJECT_PLAN.md)** - Full system plan (future)
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical architecture (future)
- **[README.md](./README.md)** - Project overview

---

## 💡 Tips & Best Practices

1. **Test with one year first** - Don't scrape everything at once
2. **Check disk space** - Each year ≈ 10-15GB when processed
3. **Use Prisma Studio** - Easiest way to inspect data
4. **Monitor scraping** - Watch backend logs for errors
5. **Respect WFMU** - 2 second delay is intentional, don't reduce it
6. **Check audio URLs** - Not all shows have downloadable archives
7. **Backup database** - Before major changes
8. **Read STATUS.md** - Most up-to-date information

---

## 🔮 What's Next

### Phase 3: Audio Processing (Pending)
- Download audio files
- Convert to OGG Vorbis
- Background job queue
- Storage management

### Phase 4: Streaming (Pending)
- Audio streaming endpoint
- Range request support
- File serving

### Phase 5: Frontend (Pending)
- Shows list page
- Show detail page
- Audio player component
- Admin panel

**See [STATUS.md](./STATUS.md) for detailed progress**

---

## 🆘 Quick Help

### Something not working?
1. Check containers (Rancher Desktop): `docker ps`
2. Check logs: `cd backend && npm run start:dev` (watch output)
3. Check database: `cd backend && npm run prisma:studio`
4. Check .env file exists and is correct
5. Try restarting: `docker compose restart`

### Where to find things?
- **Backend code**: `backend/src/`
- **Scraper logic**: `backend/src/scraper/scraper.service.ts`
- **Database schema**: `backend/prisma/schema.prisma`
- **Frontend pages**: `frontend/app/`
- **Documentation**: Root directory `.md` files

---

## 📊 Current Capabilities Summary

| Feature | Status | Command |
|---------|--------|---------|
| Scrape shows | ✅ Working | `POST /scraper/scrape-year` |
| View shows | ✅ Working | `GET /scraper/shows` |
| View tracks | ✅ Working | `GET /scraper/shows/:id` |
| Database GUI | ✅ Working | `npm run prisma:studio` |
| Download audio | ⏳ Coming | - |
| Stream audio | ⏳ Coming | - |
| Frontend UI | ⏳ Basic only | http://localhost:3000 |

---

**Keep this file bookmarked for quick access!** 📌

**Last Updated**: Current MVP state (40% complete)
