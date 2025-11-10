# Getting Started

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

1. **Node.js** (v18 or higher)
   ```bash
   node --version  # Should be v18+
   ```
   Install from: https://nodejs.org/

2. **npm** or **pnpm** (package manager)
   ```bash
   npm --version  # Should be 9+
   # or install pnpm
   npm install -g pnpm
   ```

3. **Docker & Docker Compose** (for databases)
   ```bash
   docker --version
   docker-compose --version
   ```
   Install from: https://www.docker.com/

4. **FFmpeg** (for audio processing)
   ```bash
   ffmpeg -version
   ```
   
   Install instructions:
   - **macOS**: `brew install ffmpeg`
   - **Ubuntu/Debian**: `sudo apt install ffmpeg`
   - **Windows**: Download from https://ffmpeg.org/download.html

5. **Git**
   ```bash
   git --version
   ```

### Optional but Recommended

- **PostgreSQL client** (for database inspection)
  ```bash
  brew install postgresql  # macOS
  sudo apt install postgresql-client  # Ubuntu
  ```

- **Redis client**
  ```bash
  brew install redis  # macOS
  ```

---

## Initial Setup

### Step 1: Clone and Initialize

The project structure has already been initialized. Let's verify:

```bash
cd /Users/jedmurdock/cursor/nickleminer
ls -la
```

### Step 2: Set Up Infrastructure (Docker)

Create a `docker-compose.yml` file to run PostgreSQL, Redis, and MinIO:

```bash
# This will be created in the next step
```

Start the infrastructure:

```bash
docker-compose up -d
```

Verify containers are running:

```bash
docker ps
```

You should see:
- `nickleminer-postgres` (PostgreSQL database)
- `nickleminer-redis` (Redis for queues)
- `nickleminer-minio` (MinIO for file storage)

### Step 3: Set Up Backend (Nest.js)

```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed database (optional)
npm run seed

# Start development server
npm run start:dev
```

Backend will run on: http://localhost:3001

### Step 4: Set Up Frontend (Next.js)

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

Frontend will run on: http://localhost:3000

---

## Project Structure Setup

We'll create a monorepo with separate backend and frontend:

```
nickleminer/
├── backend/           # Nest.js API server
├── frontend/          # Next.js web app
├── shared/            # Shared TypeScript types
├── storage/           # Audio files (local storage)
│   ├── raw/          # Downloaded RealAudio files
│   ├── converted/    # Converted MP3 show files
│   └── tracks/       # Individual split tracks
├── docker-compose.yml
├── .gitignore
├── package.json      # Root workspace config
└── README.md
```

---

## Development Workflow

### Start Everything

**Option 1: Manual**
```bash
# Terminal 1: Infrastructure
docker-compose up

# Terminal 2: Backend
cd backend && npm run start:dev

# Terminal 3: Frontend
cd frontend && npm run dev
```

**Option 2: Using npm workspaces (after setup)**
```bash
npm run dev  # Starts both frontend and backend
```

### Stop Everything

```bash
# Stop apps (Ctrl+C in terminals)

# Stop Docker containers
docker-compose down
```

---

## First Test: Scrape One Show

Once everything is running:

1. Open http://localhost:3000/admin
2. Click "Scrape Shows"
3. This will fetch show metadata from WFMU
4. View results in http://localhost:3000/shows
5. Select a show and click "Process Audio"
6. Monitor progress in the Jobs panel
7. Once complete, browse tracks in http://localhost:3000/tracks

---

## Environment Configuration

### Backend `.env` Template

```bash
# Database
DATABASE_URL="postgresql://nickleminer:password@localhost:5432/nickleminer"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""

# Storage
STORAGE_TYPE="local"
STORAGE_PATH="./storage"

# FFmpeg
FFMPEG_PATH="/usr/local/bin/ffmpeg"

# External APIs (get your keys)
MUSICBRAINZ_USER_AGENT="NickleMiner/1.0 (your@email.com)"
LASTFM_API_KEY=""
ACOUSTID_API_KEY=""

# API
PORT=3001
CORS_ORIGIN="http://localhost:3000"

# Processing
MAX_CONCURRENT_DOWNLOADS=2
MAX_CONCURRENT_CONVERSIONS=4
```

### Frontend `.env.local` Template

```bash
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

---

## Getting API Keys (Free)

### Last.fm API
1. Go to https://www.last.fm/api/account/create
2. Fill out the form
3. Get your API key
4. Add to backend `.env`: `LASTFM_API_KEY=your_key_here`

### AcoustID API
1. Go to https://acoustid.org/new-application
2. Create an application
3. Get your API key
4. Add to backend `.env`: `ACOUSTID_API_KEY=your_key_here`

### MusicBrainz
- No API key required!
- Just set your user agent: `MUSICBRAINZ_USER_AGENT="NickleMiner/1.0 (your@email.com)"`
- Use a valid email in case they need to contact you

---

## Troubleshooting

### Common Issues

#### 1. "Cannot connect to database"
```bash
# Check if PostgreSQL container is running
docker ps | grep postgres

# Check database logs
docker logs nickleminer-postgres

# Try restarting
docker-compose restart postgres
```

#### 2. "FFmpeg not found"
```bash
# Verify FFmpeg installation
which ffmpeg
ffmpeg -version

# Update .env with correct path
FFMPEG_PATH="/usr/local/bin/ffmpeg"
```

#### 3. "Port already in use"
```bash
# Find process using port 3000 or 3001
lsof -i :3000
lsof -i :3001

# Kill the process
kill -9 <PID>
```

#### 4. "Module not found"
```bash
# Reinstall dependencies
cd backend && rm -rf node_modules && npm install
cd frontend && rm -rf node_modules && npm install
```

#### 5. "Prisma schema out of sync"
```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

---

## Testing

### Run Backend Tests
```bash
cd backend
npm test                  # Unit tests
npm run test:e2e          # E2E tests
npm run test:cov          # Coverage report
```

### Run Frontend Tests
```bash
cd frontend
npm test                  # Jest tests
npm run test:e2e          # Playwright E2E tests
```

### Manual Testing Checklist

- [ ] Can scrape shows from WFMU
- [ ] Shows appear in database
- [ ] Can trigger audio processing
- [ ] Audio downloads successfully
- [ ] Conversion to MP3 works
- [ ] Tracks are split correctly
- [ ] Genres are tagged
- [ ] Can search tracks
- [ ] Can play tracks in browser
- [ ] Can create playlists
- [ ] Can add tracks to playlists

---

## Database Management

### View Database
```bash
# Using Prisma Studio (GUI)
cd backend
npx prisma studio
# Opens at http://localhost:5555
```

### Reset Database
```bash
cd backend
npx prisma migrate reset  # WARNING: Deletes all data!
```

### Backup Database
```bash
docker exec nickleminer-postgres pg_dump -U nickleminer nickleminer > backup.sql
```

### Restore Database
```bash
docker exec -i nickleminer-postgres psql -U nickleminer nickleminer < backup.sql
```

---

## Storage Management

### Check Storage Usage
```bash
du -sh storage/
du -sh storage/raw/
du -sh storage/converted/
du -sh storage/tracks/
```

### Clean Up Raw Files (after processing)
```bash
# Remove downloaded RealAudio files to save space
rm -rf storage/raw/*
```

### Clean Up Converted Files (after splitting)
```bash
# Remove full show MP3s after splitting to tracks
rm -rf storage/converted/*
```

---

## Development Tips

### Hot Reload
- Both backend and frontend support hot reload
- Changes to code will automatically restart the server

### Debugging

**Backend (Nest.js)**
```bash
# VS Code: Add to launch.json
{
  "type": "node",
  "request": "attach",
  "name": "Debug Nest.js",
  "port": 9229
}

# Run in debug mode
npm run start:debug
```

**Frontend (Next.js)**
- Use React DevTools extension
- Use browser console
- Next.js has built-in error overlay

### Logging

Backend logs will show:
- API requests
- Database queries
- Job processing
- Errors and warnings

Adjust log level in `.env`:
```bash
LOG_LEVEL="debug"  # debug, info, warn, error
```

---

## Next Steps

Once your environment is set up:

1. ✅ Read `PROJECT_PLAN.md` for full feature overview
2. ✅ Read `ARCHITECTURE.md` for technical details
3. ✅ Start with MVP implementation
4. ✅ Scrape your first show
5. ✅ Process audio and create playlists
6. ✅ Expand features as needed

---

## Useful Commands

### NPM Scripts (Root)
```bash
npm run dev              # Start both frontend and backend
npm run build            # Build both projects
npm run test             # Run all tests
npm run lint             # Lint all projects
```

### Backend Commands
```bash
npm run start:dev        # Development mode
npm run start:debug      # Debug mode
npm run build            # Build for production
npm run start:prod       # Production mode
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio
```

### Frontend Commands
```bash
npm run dev              # Development mode
npm run build            # Build for production
npm run start            # Production mode
npm run lint             # Lint code
npm run type-check       # TypeScript checks
```

### Docker Commands
```bash
docker-compose up -d           # Start all services
docker-compose down            # Stop all services
docker-compose logs -f         # View logs
docker-compose restart postgres # Restart specific service
docker-compose ps              # List running containers
```

---

## Resources

- **Nest.js Docs**: https://docs.nestjs.com/
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **BullMQ Docs**: https://docs.bullmq.io/
- **FFmpeg Docs**: https://ffmpeg.org/documentation.html
- **MusicBrainz API**: https://musicbrainz.org/doc/MusicBrainz_API
- **Last.fm API**: https://www.last.fm/api
- **AcoustID API**: https://acoustid.org/webservice

---

## Need Help?

If you encounter issues:

1. Check the logs for error messages
2. Verify all prerequisites are installed
3. Ensure all environment variables are set
4. Try restarting services
5. Check the troubleshooting section above

Ready to start building? Let's create the initial project structure! 🚀

