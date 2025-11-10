# Setup Instructions

Follow these steps to get NickleMiner up and running on your machine.

## ✅ Prerequisites

Before starting, ensure you have:
- [x] Node.js 18+ installed (`node --version`)
- [x] npm installed (`npm --version`)
- [x] Docker & Docker Compose installed (`docker --version`)
- [x] FFmpeg installed (`ffmpeg -version`)
  - macOS: `brew install ffmpeg`
  - Ubuntu: `sudo apt install ffmpeg`
  - Windows: Download from https://ffmpeg.org/download.html

## 📦 Step 1: Install Dependencies

### Root workspace
```bash
cd /Users/jedmurdock/cursor/nickleminer
npm install
```

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

## 🐳 Step 2: Start Docker Services

```bash
# From project root
docker-compose up -d
```

This starts:
- **PostgreSQL** on port 5432
- **Redis** on port 6379
- **MinIO** on ports 9000 (API) and 9001 (Console)

Verify they're running:
```bash
docker ps
```

## 🗄️ Step 3: Set Up Database

### Create .env file for backend

```bash
cd backend
cat > .env << 'EOF'
DATABASE_URL="postgresql://nickleminer:nickleminer_dev_password@localhost:5432/nickleminer"
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""
STORAGE_TYPE="local"
STORAGE_PATH="../storage"
FFMPEG_PATH="/usr/local/bin/ffmpeg"
PORT=3001
CORS_ORIGIN="http://localhost:3000"
MAX_CONCURRENT_DOWNLOADS=2
MAX_CONCURRENT_CONVERSIONS=4
EOF
```

### Generate Prisma Client and Run Migrations

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

When prompted for migration name, enter: `init`

## 🎨 Step 4: Set Up Frontend Environment

```bash
cd frontend
echo 'NEXT_PUBLIC_API_URL=http://localhost:3001' > .env.local
```

## 🚀 Step 5: Start Development Servers

### Option A: Start Both at Once (Recommended)

From project root:
```bash
npm run dev
```

This starts:
- Backend on http://localhost:3001
- Frontend on http://localhost:3000

### Option B: Start Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## ✅ Step 6: Verify Setup

1. Open http://localhost:3000 - You should see the NickleMiner homepage
2. Open http://localhost:3001 - You should see "Hello World!" from the backend
3. Check database is accessible:
   ```bash
   cd backend
   npm run prisma:studio
   ```
   Opens at http://localhost:5555 - You should see empty `Show` and `Track` tables

## 🎵 Step 7: Test Scraping (Once implemented)

1. Navigate to http://localhost:3000/admin
2. Click "Scrape 2020 Shows"
3. Watch the progress
4. Browse shows at http://localhost:3000/shows

## 🛠️ Troubleshooting

### "Cannot connect to database"
```bash
# Check PostgreSQL is running
docker logs nickleminer-postgres

# Restart if needed
docker-compose restart postgres
```

### "Module not found" errors
```bash
# Reinstall dependencies
cd backend && rm -rf node_modules && npm install
cd frontend && rm -rf node_modules && npm install
```

### "FFmpeg not found"
```bash
# Find FFmpeg path
which ffmpeg

# Update .env with correct path
# macOS: usually /usr/local/bin/ffmpeg or /opt/homebrew/bin/ffmpeg
# Linux: usually /usr/bin/ffmpeg
```

### "Port already in use"
```bash
# Find what's using the port
lsof -i :3000
lsof -i :3001

# Kill the process
kill -9 <PID>
```

## 📊 Project Structure Check

Your structure should look like this:

```
nickleminer/
├── backend/
│   ├── node_modules/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── database/
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── .env
│   └── package.json
├── frontend/
│   ├── node_modules/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   ├── lib/
│   ├── .env.local
│   └── package.json
├── storage/
│   ├── raw/
│   ├── converted/
│   └── tracks/
├── docker-compose.yml
├── package.json
└── README.md
```

## 🎯 Next Steps

1. ✅ Basic setup complete
2. ⏳ Implement scraper service
3. ⏳ Implement audio download/conversion
4. ⏳ Build frontend UI
5. ⏳ Test end-to-end with one show

## 📚 Useful Commands

```bash
# View database in GUI
cd backend && npm run prisma:studio

# Check Docker logs
docker-compose logs -f

# Stop all services
docker-compose down
pkill -f "nest start"
pkill -f "next dev"

# Clean restart
docker-compose down -v
docker-compose up -d
cd backend && npm run prisma:migrate
```

## 🎉 Success!

If you can see both the frontend and backend running without errors, you're ready to start building features!

Next: Implement the WFMU scraper service to fetch 2020 shows.

