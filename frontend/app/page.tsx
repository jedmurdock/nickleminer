import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20">
      <main className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">
          NickleMiner 🎵
        </h1>
        <p className="text-xl mb-4">
          Archive and playlist management for WFMU's Nickel And Dime Radio
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/shows" className="p-6 border rounded-lg hover:border-blue-500 transition-colors">
            <h2 className="text-2xl font-semibold mb-2">Shows</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Browse 2020 shows and their playlists
            </p>
          </Link>
          <Link href="/tracks" className="p-6 border rounded-lg hover:border-blue-500 transition-colors">
            <h2 className="text-2xl font-semibold mb-2">Tracks</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Search through all tracks
            </p>
          </Link>
          <Link href="/admin" className="p-6 border rounded-lg hover:border-blue-500 transition-colors">
            <h2 className="text-2xl font-semibold mb-2">Admin</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Scrape shows and process audio
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}

