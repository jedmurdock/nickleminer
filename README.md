# NickleMiner 🎵

A full-stack application for archiving, tagging, and playlist management of WFMU's "Nickel And Dime Radio with $mall ¢hange" show archives.

---

## 🎯 Project Overview

NickleMiner scrapes over 20 years of radio archives from [WFMU's Nickel And Dime Radio](https://wfmu.org/playlists/ND), converts RealAudio streams to MP3, splits them into individual tracks, automatically tags them by genre, and provides a beautiful interface to browse and create custom playlists.

### Key Features

- 🔍 **Automated Web Scraping** - Extracts show metadata and track listings from WFMU
- 🎧 **Audio Processing** - Downloads and converts RealAudio to MP3
- ✂️ **Smart Track Splitting** - Separates full shows into individual tracks
- 🏷️ **Automatic Genre Tagging** - Uses MusicBrainz, Last.fm, and AcoustID
- 🎼 **Custom Playlists** - Create and manage your own playlists
- 🔎 **Advanced Search** - Filter by genre, artist, year, and more
- 🎵 **In-Browser Playback** - Stream tracks directly in your browser

---

## 🏗️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **TailwindCSS** - Styling
- **React Audio Player** - Playback controls

### Backend
- **Nest.js** - Node.js framework
- **TypeScript** - End-to-end type safety
- **Prisma** - Database ORM
- **BullMQ** - Job queue management
- **FFmpeg** - Audio processing

### Infrastructure
- **PostgreSQL** - Primary database
- **Redis** - Queue management and caching
- **Rancher Desktop** - Local container runtime (Docker-compatible)
- **MinIO** - S3-compatible object storage (optional)

### External APIs
- **MusicBrainz** - Music metadata
- **Last.fm** - Genre tags
- **AcoustID** - Acoustic fingerprinting

---

## 📚 Documentation

- **[PROJECT_PLAN.md](./PROJECT_PLAN.md)** - Comprehensive feature plan and implementation roadmap
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture, data flows, and technical details
- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Development environment setup guide

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Rancher Desktop (provides the Docker-compatible CLI)
- FFmpeg
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nickleminer
   ```

2. **Start infrastructure**
   - Launch Rancher Desktop (ensure the `dockerd` runtime is selected)
   - Then run:
     ```bash
     docker compose up -d
     ```

3. **Set up backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   npx prisma generate
   npx prisma migrate dev
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
   - Backend API: http://localhost:3001
   - Prisma Studio: http://localhost:5555

For detailed setup instructions, see [GETTING_STARTED.md](./GETTING_STARTED.md).

---

## 📖 Usage

### Scraping Shows

1. Navigate to the Admin panel at http://localhost:3000/admin
2. Click "Scrape Shows" to fetch show metadata from WFMU
3. View scraped shows at http://localhost:3000/shows

### Processing Audio

1. Select a show from the shows list
2. Click "Process Audio" to start the pipeline:
   - Downloads RealAudio file
   - Converts to MP3
   - Splits into individual tracks
   - Tags with genres
3. Monitor progress in the Jobs panel
4. Once complete, tracks appear in http://localhost:3000/tracks

### Creating Playlists

1. Browse tracks at http://localhost:3000/tracks
2. Use filters to find tracks by genre, artist, or year
3. Click "Add to Playlist" on any track
4. Create a new playlist or add to existing
5. Manage playlists at http://localhost:3000/playlists

### Playing Music

- Click the play button on any track
- The global player at the bottom of the page starts playback
- Queue management: add multiple tracks, shuffle, repeat
- Continuous playback through entire playlists

---

## 🗺️ Project Structure

```
nickleminer/
├── backend/              # Nest.js API server
│   ├── src/
│   │   ├── shows/       # Show management
│   │   ├── tracks/      # Track management
│   │   ├── genres/      # Genre management
│   │   ├── playlists/   # Playlist management
│   │   ├── scraper/     # Web scraping service
│   │   ├── audio/       # Audio processing
│   │   ├── tagging/     # Genre tagging
│   │   └── database/    # Prisma schema
│   └── package.json
│
├── frontend/            # Next.js web app
│   ├── app/            # App Router pages
│   ├── components/     # React components
│   ├── lib/           # Utilities and API client
│   └── package.json
│
├── shared/             # Shared TypeScript types
├── storage/            # Audio files (gitignored)
│   ├── raw/           # Downloaded RealAudio
│   ├── converted/     # Full show MP3s
│   └── tracks/        # Individual track files
│
├── docker-compose.yml  # Infrastructure setup
├── PROJECT_PLAN.md    # Detailed project plan
├── ARCHITECTURE.md    # Technical architecture
├── GETTING_STARTED.md # Setup guide
└── README.md          # This file
```

---

## 🔧 Development

### Running Tests

```bash
# Backend
cd backend
npm test
npm run test:e2e
npm run test:cov

# Frontend
cd frontend
npm test
```

### Code Quality

```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Format code
npm run format
```

### Database Management

```bash
# Open Prisma Studio (GUI)
cd backend
npx prisma studio

# Create migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset
```

---

## 📊 Database Schema

### Core Tables

- **shows** - Radio show metadata (date, title, URLs)
- **tracks** - Individual tracks (title, artist, album, audio path)
- **genres** - Genre taxonomy
- **track_genres** - Many-to-many relationship with confidence scores
- **playlists** - User-created playlists
- **playlist_tracks** - Playlist contents with ordering

For detailed schema, see [PROJECT_PLAN.md](./PROJECT_PLAN.md#database-schema).

---

## 🔄 Processing Pipeline

```
1. Scrape WFMU   →  2. Download Audio  →  3. Convert to MP3
       ↓                    ↓                      ↓
   [PostgreSQL]      [storage/raw/]        [storage/converted/]
                                                   ↓
4. Split Tracks  →  5. Tag Genres   →   6. Ready to Play
       ↓                    ↓                      ↓
[storage/tracks/]    [track_genres]      [Audio Player]
```

---

## 🎨 Features

### Current (MVP)
- ✅ Web scraping of show metadata
- ✅ Audio download and conversion
- ✅ Track splitting by timestamp
- ✅ Genre tagging with MusicBrainz/Last.fm
- ✅ Track browsing and search
- ✅ Playlist creation and management
- ✅ In-browser audio playback

### Planned (Future)
- 🔜 Automatic silence-based track splitting
- 🔜 Batch processing of all archives
- 🔜 Advanced search with full-text queries
- 🔜 User authentication
- 🔜 Collaborative playlists
- 🔜 Export playlists (M3U, Spotify)
- 🔜 Mobile app
- 🔜 Recommendations engine
- 🔜 Social features (sharing, comments)

---

## ⚖️ Legal & Ethics

### Important Notes

- **Copyright**: Music tracks may be copyrighted. This tool is for **personal archival use only**.
- **No Distribution**: Do NOT redistribute downloaded audio files.
- **Respect WFMU**: Be respectful of WFMU's servers - use rate limiting and don't hammer their site.
- **Terms of Use**: By using this software, you agree to use it responsibly and legally.

### Recommendations

- Keep your archive private
- Support WFMU by becoming a member: https://wfmu.org/
- Buy music from artists when possible
- This tool is for personal enjoyment and archival, not commercial use

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Update documentation
- Follow existing code style
- Keep commits atomic and well-described

---

## 📝 License

[TBD - Choose appropriate license]

---

## 🙏 Acknowledgments

- **WFMU** - For maintaining incredible radio archives
- **$mall ¢hange** - For years of amazing music curation
- **MusicBrainz** - For open music metadata
- **Last.fm** - For genre tagging data
- **Open Source Community** - For the amazing tools that make this possible

---

## 📞 Support

- **Documentation**: See [GETTING_STARTED.md](./GETTING_STARTED.md)
- **Issues**: [GitHub Issues](link-to-issues)
- **Discussions**: [GitHub Discussions](link-to-discussions)

---

## 🗓️ Project Status

**Current Phase**: Foundation & Scraping Complete ✅ (40% Done)

**Completed**:
1. ✅ Project structure initialized
2. ✅ Database and infrastructure set up
3. ✅ Web scraper implemented

**Next Steps**:
4. ⏳ Build audio processing pipeline
5. ⏳ Implement streaming endpoints
6. ⏳ Develop frontend interface

See [STATUS.md](./STATUS.md) for detailed progress tracking.

---

## 📈 Stats

Once operational, the project will track:
- Total shows archived
- Total tracks extracted
- Total playtime
- Most popular genres
- Processing statistics

---

**Built with ❤️ for music lovers and radio enthusiasts**

🎵 *"New and vintage beats and pieces, with more than the occasional wrong turn at Albuquerque."*

