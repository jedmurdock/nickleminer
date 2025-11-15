'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getApiBase } from '@/lib/api';

type ShowSummary = {
  id: string;
  date: string;
  title?: string | null;
  archiveUrl?: string | null;
  audioFormat?: string | null;
  processed: boolean;
  rawAudioPath?: string | null;
  audioPath?: string | null;
};

type ShowsResponse = {
  count: number;
  shows: Array<
    ShowSummary & {
      _count?: { tracks: number };
    }
  >;
};

type QueueStatus = {
  name: string;
  counts: Record<string, number>;
  isPaused: boolean;
};

type QueueResponse = {
  scrape: QueueStatus;
  process: QueueStatus;
};

const apiBase = getApiBase();

export default function AdminPage() {
  const [year, setYear] = useState<number>(2020);
  const [scrapeStatus, setScrapeStatus] = useState<string | null>(null);
  const [isScraping, setIsScraping] = useState(false);

  const [shows, setShows] = useState<ShowsResponse['shows']>([]);
  const [isLoadingShows, setIsLoadingShows] = useState(false);
  const [showError, setShowError] = useState<string | null>(null);

  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [processStatus, setProcessStatus] = useState<Record<string, string>>({});

  const [queueStatus, setQueueStatus] = useState<QueueResponse | null>(null);
  const [isLoadingQueues, setIsLoadingQueues] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [bulkStatus, setBulkStatus] = useState<string | null>(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const formattedYear = useMemo(() => year.toString(), [year]);

  const fetchShows = useCallback(async () => {
    setIsLoadingShows(true);
    setShowError(null);
    try {
      const res = await fetch(`${apiBase}/scraper/shows`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Failed to fetch shows (${res.status})`);
      }
      const payload = (await res.json()) as ShowsResponse;
      setShows(payload.shows ?? []);
    } catch (error) {
      setShowError((error as Error).message);
    } finally {
      setIsLoadingShows(false);
    }
  }, []);

  useEffect(() => {
    void fetchShows();
  }, [fetchShows]);

  const fetchQueueStatus = useCallback(async () => {
    setIsLoadingQueues(true);
    setQueueError(null);
    try {
      const res = await fetch(`${apiBase}/queue/status`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Failed to fetch queue status (${res.status})`);
      }
      const payload = (await res.json()) as QueueResponse;
      setQueueStatus(payload);
    } catch (error) {
      setQueueError((error as Error).message);
    } finally {
      setIsLoadingQueues(false);
    }
  }, []);

  useEffect(() => {
    void fetchQueueStatus();
  }, [fetchQueueStatus]);

  const handleScrapeYear = useCallback(async () => {
    setIsScraping(true);
    setScrapeStatus(null);
    try {
      const res = await fetch(`${apiBase}/scraper/scrape-year`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ year }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to enqueue scrape job.' }));
        throw new Error(err.message || `Failed with status ${res.status}`);
      }
      const payload: { message?: string; jobId?: string | number; year?: number } = await res.json();
      const statusMessage = payload.jobId
        ? `Queued scrape job ${payload.jobId} for ${payload.year ?? formattedYear}.`
        : payload.message ?? `Scrape job queued for ${formattedYear}.`;
      setScrapeStatus(statusMessage);
      await fetchShows();
    } catch (error) {
      setScrapeStatus((error as Error).message);
    } finally {
      setIsScraping(false);
    }
  }, [year, formattedYear, fetchShows]);

  const handleProcessShow = useCallback(
    async (showId: string) => {
      setProcessingIds((prev) => new Set(prev).add(showId));
      setProcessStatus((prev) => ({ ...prev, [showId]: 'Enqueuing…' }));
      try {
        const res = await fetch(`${apiBase}/scraper/shows/${showId}/process`, {
          method: 'POST',
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: 'Failed to enqueue processing job.' }));
          throw new Error(err.message || `Request failed with status ${res.status}`);
        }
        const payload: { message?: string; jobId?: string | number } = await res.json();
        const statusMessage = payload.jobId
          ? `Queued processing job ${payload.jobId}.`
          : payload.message ?? 'Processing job queued.';
        setProcessStatus((prev) => ({ ...prev, [showId]: statusMessage }));
        await fetchShows();
        await fetchQueueStatus();
      } catch (error) {
        setProcessStatus((prev) => ({ ...prev, [showId]: (error as Error).message }));
      } finally {
        setProcessingIds((prev) => {
          const next = new Set(prev);
          next.delete(showId);
          return next;
        });
      }
    },
    [fetchShows, fetchQueueStatus],
  );

  const handleProcessAll = useCallback(async () => {
    setIsBulkProcessing(true);
    setBulkStatus(null);
    try {
      const res = await fetch(`${apiBase}/scraper/process-all`, {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to enqueue bulk processing job.' }));
        throw new Error(err.message || `Request failed with status ${res.status}`);
      }
      const payload: { message?: string; count?: number } = await res.json();
      setBulkStatus(payload.message ?? `Queued ${payload.count ?? 0} processing jobs.`);
      await Promise.all([fetchShows(), fetchQueueStatus()]);
    } catch (error) {
      setBulkStatus((error as Error).message);
    } finally {
      setIsBulkProcessing(false);
    }
  }, [fetchShows, fetchQueueStatus]);

  return (
    <div className="min-h-screen p-8 pb-24 sm:p-12">
      <main className="max-w-5xl mx-auto space-y-12">
        <section>
          <h1 className="text-4xl font-bold mb-4">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Trigger scraping and audio processing jobs. The backend base URL is{' '}
            <code className="font-mono">{apiBase}</code>.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Queue Status</h2>
          {queueError && <p className="text-sm text-red-600">{queueError}</p>}
          {bulkStatus && <p className="text-sm text-gray-600 dark:text-gray-300">{bulkStatus}</p>}
          <div className="grid gap-4 md:grid-cols-2">
            {['scrape', 'process'].map((key) => {
              const entry = queueStatus?.[key as keyof QueueResponse];
              return (
                <div key={key} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold capitalize">{key} queue</h3>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        entry?.isPaused ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {entry?.isPaused ? 'Paused' : 'Running'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 break-all">{entry?.name ?? '—'}</p>
                  <dl className="grid grid-cols-2 gap-2 mt-4 text-sm">
                    {entry
                      ? Object.entries(entry.counts).map(([status, value]) => (
                          <div key={status} className="flex items-center justify-between">
                            <dt className="text-gray-500 capitalize">{status}</dt>
                            <dd className="font-mono">{value}</dd>
                          </div>
                        ))
                      : (
                          <p className="col-span-2 text-gray-500">No data</p>
                        )}
                  </dl>
                </div>
              );
            })}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => void handleScrapeYear()}
              disabled={isScraping}
              className="rounded bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isScraping ? 'Scraping…' : `Scrape ${formattedYear}`}
            </button>
            <button
              onClick={() => void handleProcessAll()}
              disabled={isBulkProcessing}
              className="rounded bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isBulkProcessing ? 'Queuing…' : 'Process all pending shows'}
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Shows</h2>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-sm">
                <span>Year:</span>
                <input
                  type="number"
                  min={1997}
                  max={new Date().getFullYear()}
                  value={year}
                  onChange={(event) => setYear(Number(event.target.value))}
                  className="rounded border border-gray-300 px-2 py-1 w-28"
                />
              </label>
              <button
                onClick={() => void fetchQueueStatus()}
                className="rounded border border-gray-400 px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                disabled={isLoadingQueues}
              >
                {isLoadingQueues ? 'Refreshing queues…' : 'Refresh queues'}
              </button>
              <button
                onClick={() => void fetchShows()}
                className="rounded border border-gray-400 px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                disabled={isLoadingShows}
              >
                {isLoadingShows ? 'Refreshing shows…' : 'Refresh shows'}
              </button>
            </div>
          </div>
          {showError && <p className="text-sm text-red-600">{showError}</p>}

          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Date</th>
                  <th className="px-4 py-2 text-left font-semibold">Title</th>
                  <th className="px-4 py-2 text-left font-semibold">Format</th>
                  <th className="px-4 py-2 text-left font-semibold">Processed</th>
                  <th className="px-4 py-2 text-left font-semibold">Tracks</th>
                  <th className="px-4 py-2 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {shows.map((show) => {
                  const showDate = new Date(show.date).toLocaleDateString();
                  const trackCount = show._count?.tracks ?? '—';
                  const statusMessage = processStatus[show.id];
                  const isProcessing = processingIds.has(show.id);

                  return (
                    <tr key={show.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                      <td className="px-4 py-3 align-top whitespace-nowrap">{showDate}</td>
                      <td className="px-4 py-3 align-top max-w-xs">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {show.title || 'Untitled show'}
                        </div>
                        <div className="text-xs text-gray-500 break-all">
                          {show.archiveUrl ? `Archive: ${show.archiveUrl}` : 'No archive URL yet'}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        <span className="font-mono text-sm">
                          {show.audioFormat || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        {show.processed ? (
                          <span className="inline-flex items-center rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                            Converted
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top text-center">{trackCount}</td>
                      <td className="px-4 py-3 align-top space-y-2">
                        <button
                          onClick={() => void handleProcessShow(show.id)}
                          disabled={isProcessing}
                          className="rounded bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isProcessing ? 'Processing…' : 'Process Audio'}
                        </button>
                        {statusMessage && (
                          <div className="text-xs text-gray-600 dark:text-gray-300 max-w-xs break-words">
                            {statusMessage}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {shows.length === 0 && !isLoadingShows && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                      No shows found. Scrape a year to populate the database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
