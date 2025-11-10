import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { PrismaService } from '../database/prisma.service';

interface ParsedShow {
  date: Date;
  playlistUrl: string;
  title?: string;
}

interface ParsedTrack {
  position: number;
  artist: string;
  title: string;
  album?: string;
  label?: string;
  year?: number;
  comments?: string;
}

interface AudioFormat {
  format: string; // 'mp3', 'ra', 'ogg', 'aac'
  url: string;
  quality?: string; // '128k', '192k', '320k'
}

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  private readonly WFMU_BASE_URL = 'https://wfmu.org';
  private readonly PLAYLIST_INDEX_URL = 'https://wfmu.org/playlists/ND';

  constructor(private prisma: PrismaService) {}

  /**
   * Scrape all shows from a specific year
   */
  async scrapeYear(year: number): Promise<void> {
    this.logger.log(`Starting scrape for year ${year}`);

    try {
      // Fetch the index page
      const response = await axios.get(this.PLAYLIST_INDEX_URL);
      const $ = cheerio.load(response.data);

      // Parse all show links
      const shows: ParsedShow[] = [];
      
      // WFMU playlist pages typically have links like:
      // <a href="/playlists/shows/ND">See the playlist</a>
      // Format: /playlists/shows/ND or with date parameters
      
      $('a[href*="/playlists/shows/ND"]').each((_, element) => {
        const href = $(element).attr('href');
        if (!href) return;

        // Extract date from the context (usually in the same line or parent)
        const linkText = $(element).text().trim();
        const parentText = $(element).parent().text().trim();
        
        // Look for date patterns like "January 1, 2020" or "01/01/2020"
        const dateMatch = parentText.match(/(\w+\s+\d{1,2},\s+\d{4})|(\d{1,2}\/\d{1,2}\/\d{4})/);
        
        if (dateMatch) {
          const dateStr = dateMatch[0];
          const parsedDate = new Date(dateStr);
          
          // Filter for the requested year
          if (parsedDate.getFullYear() === year) {
            const fullUrl = href.startsWith('http') ? href : `${this.WFMU_BASE_URL}${href}`;
            shows.push({
              date: parsedDate,
              playlistUrl: fullUrl,
              title: this.extractTitle(parentText),
            });
          }
        }
      });

      this.logger.log(`Found ${shows.length} shows for ${year}`);

      // Process each show
      for (const show of shows) {
        await this.scrapeAndSaveShow(show);
        // Add delay to be respectful to the server
        await this.delay(2000); // 2 seconds between requests
      }

      this.logger.log(`Completed scraping ${year}`);
    } catch (error) {
      this.logger.error(`Error scraping year ${year}:`, error);
      throw error;
    }
  }

  /**
   * Scrape a single show and save it with its tracks
   */
  async scrapeAndSaveShow(showInfo: ParsedShow): Promise<void> {
    this.logger.log(`Scraping show: ${showInfo.date.toISOString()}`);

    try {
      // Check if show already exists
      const existing = await this.prisma.show.findUnique({
        where: { playlistUrl: showInfo.playlistUrl },
      });

      if (existing) {
        this.logger.log(`Show already exists: ${showInfo.date.toISOString()}`);
        return;
      }

      // Fetch the playlist page
      const response = await axios.get(showInfo.playlistUrl);
      const $ = cheerio.load(response.data);

      // Detect audio formats available
      const audioFormats = this.detectAudioFormats($);
      const bestFormat = this.selectBestFormat(audioFormats);

      // Parse track listing
      const tracks = this.parseTrackListing($);

      // Save show to database
      const show = await this.prisma.show.create({
        data: {
          date: showInfo.date,
          title: showInfo.title,
          playlistUrl: showInfo.playlistUrl,
          archiveUrl: bestFormat?.url,
          audioFormat: bestFormat?.format,
          processed: false,
          tracks: {
            create: tracks,
          },
        },
      });

      this.logger.log(
        `Saved show ${show.id} with ${tracks.length} tracks`,
      );
    } catch (error) {
      this.logger.error(
        `Error scraping show ${showInfo.playlistUrl}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Detect available audio formats from the page
   */
  private detectAudioFormats($: cheerio.CheerioAPI): AudioFormat[] {
    const formats: AudioFormat[] = [];

    // Look for common audio link patterns
    // MP3 links
    $('a[href$=".mp3"], a[href*=".mp3?"]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        const fullUrl = href.startsWith('http') ? href : `${this.WFMU_BASE_URL}${href}`;
        const quality = this.extractQuality(href);
        formats.push({ format: 'mp3', url: fullUrl, quality });
      }
    });

    // RealAudio links
    $('a[href$=".ra"], a[href$=".rm"], a[href*="realaudio"]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        const fullUrl = href.startsWith('http') ? href : `${this.WFMU_BASE_URL}${href}`;
        formats.push({ format: 'ra', url: fullUrl });
      }
    });

    // OGG links
    $('a[href$=".ogg"]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        const fullUrl = href.startsWith('http') ? href : `${this.WFMU_BASE_URL}${href}`;
        formats.push({ format: 'ogg', url: fullUrl });
      }
    });

    // AAC/M4A links
    $('a[href$=".m4a"], a[href$=".aac"]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        const fullUrl = href.startsWith('http') ? href : `${this.WFMU_BASE_URL}${href}`;
        formats.push({ format: 'aac', url: fullUrl });
      }
    });

    // Check for streaming links in text or specific elements
    const pageText = $.text();
    if (pageText.includes('128k MP3')) {
      const match = pageText.match(/(https?:\/\/[^\s]+\.mp3)/);
      if (match) {
        formats.push({ format: 'mp3', url: match[1], quality: '128k' });
      }
    }

    return formats;
  }

  /**
   * Select the best audio format (prefer MP3 > OGG > AAC > RealAudio)
   */
  private selectBestFormat(formats: AudioFormat[]): AudioFormat | null {
    if (formats.length === 0) return null;

    // Priority order
    const priorities = {
      'mp3': 10,
      'ogg': 8,
      'aac': 6,
      'ra': 1,
    };

    // Sort by priority and quality
    formats.sort((a, b) => {
      const priorityDiff = (priorities[b.format] || 0) - (priorities[a.format] || 0);
      if (priorityDiff !== 0) return priorityDiff;

      // If same format, prefer higher quality
      const qualityA = parseInt(a.quality || '0');
      const qualityB = parseInt(b.quality || '0');
      return qualityB - qualityA;
    });

    return formats[0];
  }

  /**
   * Extract quality from URL (e.g., "128k", "192k", "320k")
   */
  private extractQuality(url: string): string | undefined {
    const match = url.match(/(\d+k)/i);
    return match ? match[1] : undefined;
  }

  /**
   * Parse track listing from the playlist HTML
   */
  private parseTrackListing($: cheerio.CheerioAPI): ParsedTrack[] {
    const tracks: ParsedTrack[] = [];
    
    // WFMU playlists typically use tables or divs with specific classes
    // This is a generic parser - may need adjustment based on actual HTML structure
    
    // Try table-based playlists first
    $('table tr').each((index, element) => {
      if (index === 0) return; // Skip header row
      
      const $row = $(element);
      const cells = $row.find('td');
      
      if (cells.length >= 2) {
        const track = this.parseTrackRow($, cells);
        if (track) {
          tracks.push({ ...track, position: index });
        }
      }
    });

    // If no table found, try div-based playlists
    if (tracks.length === 0) {
      $('.playlist-item, .track, [class*="playlist"]').each((index, element) => {
        const $item = $(element);
        const track = this.parseTrackDiv($, $item);
        if (track) {
          tracks.push({ ...track, position: index + 1 });
        }
      });
    }

    return tracks;
  }

  /**
   * Parse a track from a table row
   */
  private parseTrackRow($: cheerio.CheerioAPI, cells: cheerio.Cheerio<any>): ParsedTrack | null {
    // Common formats:
    // Cell 0: Artist
    // Cell 1: Title
    // Cell 2: Album
    // Cell 3: Label
    // Cell 4: Year
    
    const getText = (index: number) => $(cells[index]).text().trim();
    
    const artist = getText(0);
    const title = getText(1);
    
    if (!artist || !title) return null;
    
    return {
      position: 0, // Will be set by caller
      artist,
      title,
      album: cells.length > 2 ? getText(2) : undefined,
      label: cells.length > 3 ? getText(3) : undefined,
      year: cells.length > 4 ? this.parseYear(getText(4)) : undefined,
    };
  }

  /**
   * Parse a track from a div element
   */
  private parseTrackDiv($: cheerio.CheerioAPI, $item: cheerio.Cheerio<any>): ParsedTrack | null {
    const text = $item.text().trim();
    
    // Try to parse "Artist - Title" format
    const match = text.match(/^(.+?)\s*[-–]\s*(.+?)$/);
    if (match) {
      return {
        position: 0,
        artist: match[1].trim(),
        title: match[2].trim(),
      };
    }
    
    return null;
  }

  /**
   * Extract show title from text
   */
  private extractTitle(text: string): string | undefined {
    // Remove date and common patterns
    let title = text
      .replace(/(\w+\s+\d{1,2},\s+\d{4})|(\d{1,2}\/\d{1,2}\/\d{4})/, '')
      .replace(/see the playlist/i, '')
      .replace(/listen:/i, '')
      .trim();
    
    // Return if we have something meaningful
    return title.length > 3 ? title : undefined;
  }

  /**
   * Parse year from text
   */
  private parseYear(text: string): number | undefined {
    const match = text.match(/\b(19\d{2}|20\d{2})\b/);
    return match ? parseInt(match[1]) : undefined;
  }

  /**
   * Delay helper for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get all shows from database
   */
  async getAllShows() {
    return this.prisma.show.findMany({
      include: {
        _count: {
          select: { tracks: true },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  /**
   * Get a specific show with its tracks
   */
  async getShow(id: string) {
    return this.prisma.show.findUnique({
      where: { id },
      include: {
        tracks: {
          orderBy: { position: 'asc' },
        },
      },
    });
  }
}

