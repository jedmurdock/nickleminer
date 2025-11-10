# Decisions Needed Before Implementation

This document outlines key decisions you should make before we start coding. These choices will affect the project's scope, complexity, and timeline.

---

## 1. Scope Decision: How Much to Archive?

### Options:

**A. Full Archive (20+ years)**
- **Pros**: Complete collection, comprehensive music database
- **Cons**: 
  - ~200GB storage needed
  - Weeks of processing time
  - Higher complexity
  - More API calls = need for rate limiting

**B. Recent Years Only (e.g., 2020-2024)**
- **Pros**: 
  - ~40GB storage
  - Days instead of weeks
  - Easier to test
  - Good for MVP
- **Cons**: Incomplete archive

**C. Sample/Test Approach (10-20 shows)**
- **Pros**: 
  - ~2-4GB storage
  - Quick to implement and test
  - Perfect for development
  - Can expand later
- **Cons**: Very limited collection

### 🤔 Recommendation
Start with **Option C** for development, then expand to **Option B** for personal use.

**Your choice**: _______________

---

## 2. Audio Format Decision

### MP3 Bitrate Options:

| Bitrate | Quality | Size per Hour | Total (2000hrs) |
|---------|---------|---------------|-----------------|
| 128kbps | Good    | ~57 MB        | ~114 GB         |
| 192kbps | Better  | ~86 MB        | ~172 GB         |
| 320kbps | Best    | ~144 MB       | ~288 GB         |

### Alternative: OGG Vorbis
- **Pros**: Better quality-to-size ratio, open source
- **Cons**: Less universal browser support than MP3

### 🤔 Recommendation
**192kbps MP3** - Best balance of quality and size for radio archives.

**Your choice**: _______________

---

## 3. Storage Decision

### Options:

**A. Local Filesystem**
- **Pros**: Simple, fast, no external dependencies
- **Cons**: Limited to one machine, manual backups
- **Best for**: Development, single-user

**B. MinIO (S3-compatible)**
- **Pros**: Scalable, backups, can move to AWS later
- **Cons**: More complex setup
- **Best for**: Production, multi-machine

**C. Cloud (AWS S3, Backblaze B2)**
- **Pros**: Professional, managed, backed up
- **Cons**: Ongoing costs ($5-20/month for 200GB)
- **Best for**: Long-term production

### 🤔 Recommendation
Start with **Option A** (local), containerize with **Option B** (MinIO) for future flexibility.

**Your choice**: _______________

---

## 4. Track Splitting Strategy

### The Challenge:
Radio shows are continuous. We need to split them into individual tracks.

### Options:

**A. Timestamp-Based (from WFMU playlists)**
- **Pros**: Accurate if timestamps exist, fast
- **Cons**: Not all playlists have timestamps
- **Implementation**: Parse playlist, use FFmpeg split
- **Success rate**: ~60-70% of shows

**B. Silence Detection**
- **Pros**: Works without timestamps
- **Cons**: Inaccurate (splits mid-song or misses breaks), needs manual review
- **Implementation**: FFmpeg silencedetect
- **Success rate**: ~40-60% accuracy

**C. Hybrid Approach**
- **Pros**: Best of both worlds
- **Cons**: More complex
- **Implementation**: Try A, fall back to B, allow manual adjustment
- **Success rate**: ~80-90%

**D. Manual/Semi-Automatic**
- **Pros**: Most accurate
- **Cons**: Time-consuming, requires UI for marking splits
- **Implementation**: Waveform viewer with manual split markers

### 🤔 Recommendation
**Option C** (Hybrid) for MVP, add **Option D** as enhancement.

**Your choice**: _______________

---

## 5. Genre Tagging Approach

### How aggressive should automatic tagging be?

**A. Conservative (High Confidence Only)**
- Only tag if MusicBrainz + Last.fm both agree
- Confidence threshold: 0.8+
- Result: ~40-50% of tracks auto-tagged, very accurate

**B. Moderate (Recommended)**
- Tag if any API returns genres with good match
- Confidence threshold: 0.6+
- Result: ~70-80% of tracks auto-tagged, mostly accurate

**C. Aggressive (Tag Everything)**
- Infer genres from similar artists, labels, era
- Confidence threshold: 0.3+
- Result: ~95% of tracks auto-tagged, some inaccuracies

**D. Manual Only**
- No automatic tagging, build UI for manual tagging
- Result: 100% accuracy but very time-consuming

### 🤔 Recommendation
**Option B** (Moderate) with manual override capability.

**Your choice**: _______________

---

## 6. User Interface Style

### Options:

**A. Clean & Minimal (Spotify-like)**
- Dark theme, album grid, simple navigation
- Focus on music playback
- **Libraries**: TailwindCSS + Headless UI

**B. Detailed & Information-Rich**
- Show all metadata, multiple views, advanced filters
- Power-user focused
- **Libraries**: Material-UI or Ant Design

**C. Nostalgic/Retro**
- Match WFMU's aesthetic, vintage design
- Fun and thematic
- **Libraries**: Custom CSS with retro styling

### 🤔 Recommendation
**Option A** (Clean & Minimal) for MVP - easier to build, better UX.

**Your choice**: _______________

---

## 7. MVP Feature Priority

### Must-Have (Core MVP):
- [ ] Scrape show metadata
- [ ] Download and convert one show
- [ ] Basic track splitting
- [ ] Store tracks in database
- [ ] Browse tracks in simple UI
- [ ] Play tracks in browser
- [ ] Create basic playlists

### Nice-to-Have (Enhanced MVP):
- [ ] Automatic genre tagging
- [ ] Advanced search and filters
- [ ] Batch processing multiple shows
- [ ] Progress tracking for jobs
- [ ] Export playlists

### Future Features:
- [ ] User authentication
- [ ] Social features
- [ ] Mobile app
- [ ] Recommendations
- [ ] Integration with streaming services

### 🤔 Which features do you want in your MVP?
Core only, or include some Nice-to-Have features?

**Your choice**: _______________

---

## 8. Development Approach

### Options:

**A. Build Everything from Scratch**
- Full control, learning opportunity
- Longer development time (~8-12 weeks)

**B. Use Boilerplates/Templates**
- Faster start with pre-configured setup
- Less customization, some learning curve
- **Time**: ~6-8 weeks

**C. Hybrid (Recommended)**
- Use official framework CLIs (Nest.js, Next.js)
- Build custom features
- Balance of speed and control
- **Time**: ~6-10 weeks

### 🤔 Recommendation
**Option C** - Use `nest new` and `create-next-app`, build features custom.

**Your choice**: _______________

---

## 9. Package Manager

### Options:

**A. npm**
- Default, universally supported
- Slower, larger node_modules

**B. pnpm** (Recommended)
- Faster, disk space efficient
- Better monorepo support
- Modern and actively developed

**C. yarn**
- Fast, good caching
- Workspaces support
- Popular in React ecosystem

### 🤔 Recommendation
**pnpm** for better performance and monorepo management.

**Your choice**: _______________

---

## 10. Monorepo vs Separate Repos

### Options:

**A. Monorepo (Single Repository)**
- **Structure**: 
  ```
  nickleminer/
  ├── backend/
  ├── frontend/
  └── shared/
  ```
- **Pros**: 
  - Shared types
  - Atomic commits
  - Easier local development
- **Cons**: 
  - Slightly more complex setup
  - Single version control

**B. Separate Repositories**
- **Structure**:
  ```
  nickleminer-backend/
  nickleminer-frontend/
  nickleminer-types/ (npm package)
  ```
- **Pros**: 
  - Independent deployments
  - Smaller repos
- **Cons**: 
  - Harder to keep types in sync
  - More setup overhead

### 🤔 Recommendation
**Option A** (Monorepo) for faster development and type sharing.

**Your choice**: _______________

---

## 11. Environment Setup

### Do you already have these installed?

- [ ] Node.js 18+ (`node --version`)
- [ ] Rancher Desktop with dockerd runtime (`docker --version`, `docker compose version`)
- [ ] FFmpeg (`ffmpeg -version`)
- [ ] PostgreSQL client (optional, for inspection)
- [ ] Git (`git --version`)

### Need help installing any of these?
Let me know which OS you're on and I can provide installation commands.

**Your OS**: _______________

---

## 12. API Keys

### Which APIs do you want to use?

- [ ] **MusicBrainz** (No key required, just user agent)
- [ ] **Last.fm** (Free key: https://www.last.fm/api/account/create)
- [ ] **AcoustID** (Free key: https://acoustid.org/new-application)
- [ ] **Spotify** (Optional, requires app registration)

### Do you want to:
**A.** Get API keys now (5 minutes)
**B.** Skip APIs for MVP, add later
**C.** Use mock data for development

**Your choice**: _______________

---

## 13. Testing Strategy

### How much testing do you want?

**A. Minimal**
- Manual testing only
- Fastest to build
- Higher bug risk

**B. Basic (Recommended)**
- Unit tests for critical services
- E2E tests for main flows
- Good balance

**C. Comprehensive**
- High test coverage
- Integration tests
- Slower development

### 🤔 Recommendation
**Option B** - Test critical paths, manual test UI.

**Your choice**: _______________

---

## 14. Deployment Plan

### Where will this run?

**A. Local Machine Only**
- Simplest, no deployment needed
- Just for personal use

**B. Home Server / NAS**
- Always available
- Local network access
- No cloud costs

**C. Cloud (AWS, DigitalOcean, etc.)**
- Public access
- Professional setup
- ~$20-50/month

**D. To be decided later**

### 🤔 Recommendation
Start with **Option A**, plan for **Option B** or **C** later.

**Your choice**: _______________

---

## Summary of Recommendations

Based on best practices for a project like this, here are my recommendations:

| Decision | Recommended Choice | Rationale |
|----------|-------------------|-----------|
| Scope | 10-20 shows for MVP | Test quickly, expand later |
| Audio Format | 192kbps MP3 | Best quality/size balance |
| Storage | Local → MinIO | Simple start, scalable future |
| Track Splitting | Hybrid approach | Best accuracy |
| Genre Tagging | Moderate (60%+) | Good coverage, good accuracy |
| UI Style | Clean & Minimal | Faster to build, better UX |
| MVP Features | Core + some enhanced | Balance of features & time |
| Development | Hybrid approach | Use CLIs + custom code |
| Package Manager | pnpm | Fast, efficient, modern |
| Repo Structure | Monorepo | Easier development |
| Testing | Basic | Critical coverage only |
| Deployment | Local first | Start simple |

---

## Next Steps

Once you've made these decisions:

1. I'll set up the project structure
2. Initialize backend and frontend
3. Set up Rancher Desktop container infrastructure
4. Implement the first feature (scraping)
5. Build incrementally from there

**Ready to proceed? Please let me know your choices for the key decisions above, or tell me to use all the recommendations!** 🚀

