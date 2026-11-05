import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StoreGame } from '@/types/store';
import { fetchStoreCatalog, StoreFetchResult } from '@/services/storeApi';
import { api } from '@/services/tauri';
import { useNavigationStore } from '@/stores/navigationStore';
import { StoreGameModal } from './StoreGameModal';
import {
  Search,
  Sparkles,
  Flame,
  HardDrive,
  Layers,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  ArrowUpDown,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Tag,
  Zap,
  RefreshCw,
  Globe,
  Database,
  Download,
  Link2,
  CheckCircle2,
  X,
} from 'lucide-react';

export const StoreScreen: React.FC = () => {
  const { setCurrentTab } = useNavigationStore();

  const [games, setGames] = useState<StoreGame[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [catalogMeta, setCatalogMeta] = useState<StoreFetchResult | null>(null);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rank' | 'name' | 'size_asc' | 'size_desc'>('rank');
  const [selectedGame, setSelectedGame] = useState<StoreGame | null>(null);

  const shelfRef = useRef<HTMLDivElement>(null);

  // Load catalog on mount from API
  useEffect(() => {
    let mounted = true;

    async function loadInitial() {
      setIsLoading(true);
      const res = await fetchStoreCatalog(false);
      if (mounted) {
        setGames(res.games);
        setCatalogMeta(res);
        setIsLoading(false);
      }
    }

    loadInitial();
    return () => {
      mounted = false;
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const res = await fetchStoreCatalog(true);
    setGames(res.games);
    setCatalogMeta(res);
    setIsRefreshing(false);
  };

  const handleQuickDownloadMagnet = async (game: StoreGame, launchExternal: boolean = false) => {
    if (!game.magnetUrl || game.magnetUrl.length === 0) {
      setSelectedGame(game);
      return;
    }

    const match = game.metadata.repackSize?.match(/([\d.]+)\s*GB/i);
    const estimatedBytes = match ? Math.round(parseFloat(match[1]) * 1024 * 1024 * 1024) : 21474836480;

    try {
      const magnetUri = game.magnetUrl[0].magnetUrl;
      await api.addTorrentTask(magnetUri, game.name, undefined, estimatedBytes);
      if (launchExternal) {
        await api.openInExternalTorrentClient(magnetUri);
        setToastNotification(`Started download & opened external client for "${game.name}".`);
      } else {
        setToastNotification(`Started in-app download for "${game.name}"! Tracking progress in Downloads tab.`);
      }
      setTimeout(() => setToastNotification(null), 6000);
    } catch (err: any) {
      alert(`Could not start in-app download: ${err?.message || err}`);
    }
  };

  const handleHorizontalWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0) {
      e.currentTarget.scrollLeft += e.deltaY;
    }
  };

  const scrollShelf = (direction: 'left' | 'right') => {
    if (shelfRef.current) {
      const scrollAmount = direction === 'left' ? -480 : 480;
      shelfRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Extract unique genres across all games
  const allGenres = useMemo(() => {
    const set = new Set<string>();
    games.forEach((g) => {
      if (g.metadata.genres) {
        g.metadata.genres.split(',').forEach((genre) => {
          set.add(genre.trim());
        });
      }
    });
    return Array.from(set).slice(0, 12);
  }, [games]);

  // Parse numeric gigabytes from repackSize string (e.g. "56.4 GB" -> 56.4)
  const parseSize = (sizeStr?: string): number => {
    if (!sizeStr) return 0;
    const match = sizeStr.match(/([\d.]+)\s*GB/i);
    return match ? parseFloat(match[1]) : 0;
  };

  // Filter & Sort
  const filteredGames = useMemo(() => {
    let result = games.filter((g) => {
      const matchesSearch =
        searchQuery === '' ||
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.metadata.developer &&
          g.metadata.developer.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (g.metadata.genres &&
          g.metadata.genres.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesGenre =
        selectedGenre === 'all' ||
        (g.metadata.genres &&
          g.metadata.genres.toLowerCase().includes(selectedGenre.toLowerCase()));

      return matchesSearch && matchesGenre;
    });

    result.sort((a, b) => {
      if (sortBy === 'rank') {
        return (a.rank || 999) - (b.rank || 999);
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'size_asc') {
        return parseSize(a.metadata.repackSize) - parseSize(b.metadata.repackSize);
      }
      if (sortBy === 'size_desc') {
        return parseSize(b.metadata.repackSize) - parseSize(a.metadata.repackSize);
      }
      return 0;
    });

    return result;
  }, [games, searchQuery, selectedGenre, sortBy]);

  // Featured Hero Game (Top #1 or first item)
  const heroGame = games[0] || null;

  return (
    <div className="flex-1 overflow-y-auto min-h-0 px-8 py-6 space-y-8 select-none bg-gradient-to-b from-[#0e1624] via-[#0b0f17] to-[#080c12] relative">
      {/* Top Catalog Status & Live Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center font-bold">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-extrabold text-white tracking-tight">
                Universal Game Catalog
              </h2>
              <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live API Connected</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {catalogMeta
                ? `${catalogMeta.totalGames} Verified Releases • ${catalogMeta.isFromCache ? 'Cached locally' : 'Fresh from cloud catalog'}`
                : 'Connecting to repository API...'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 transition-all shadow-sm"
            title="Refresh game catalog from API"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Updating...' : 'Sync Catalog'}</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-6 animate-pulse">
          <div className="w-full h-80 rounded-3xl bg-slate-900/80 border border-slate-800" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="aspect-[2/3] rounded-2xl bg-slate-900 border border-slate-800" />
            ))}
          </div>
        </div>
      )}

      {/* Hero Showcase (Steam Big Picture Spotlight) */}
      {!isLoading && heroGame && (
        <section className="relative w-full rounded-3xl overflow-hidden bg-slate-900 border border-slate-700/60 shadow-2xl group min-h-[360px] md:min-h-[420px] flex items-end">
          {/* Hero Banner Background Image */}
          <div className="absolute inset-0 z-0">
            <img
              src={heroGame.images?.[0] || heroGame.logo}
              alt={heroGame.name}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 brightness-[0.65]"
            />
            {/* Cinematic Gradient Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-transparent" />
          </div>

          {/* Hero Details Overlay */}
          <div className="relative z-10 p-8 md:p-12 max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 text-xs font-black tracking-widest uppercase shadow-md shadow-amber-500/30 flex items-center space-x-1">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>#1 Most Popular Repack</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-bold uppercase tracking-wider">
                {heroGame.metadata.developer || 'Featured Studio'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center space-x-1">
                <HardDrive className="w-3.5 h-3.5" />
                <span>Repack: {heroGame.metadata.repackSize}</span>
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-md">
              {heroGame.name}
            </h1>

            <p className="text-sm md:text-base text-slate-300 line-clamp-2 md:line-clamp-3 leading-relaxed drop-shadow">
              {heroGame.description}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setSelectedGame(heroGame)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-sm tracking-wide uppercase transition-all shadow-lg shadow-sky-500/30 active:scale-95 flex items-center space-x-2"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Explore Game & Specs</span>
              </button>

              {heroGame.magnetUrl && heroGame.magnetUrl.length > 0 && (
                <button
                  onClick={() => handleQuickDownloadMagnet(heroGame)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm tracking-wide uppercase transition-all shadow-lg shadow-emerald-500/30 active:scale-95 flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Repack Torrent ({heroGame.magnetUrl.length} Mirrors)</span>
                </button>
              )}

              <button
                onClick={() => setSelectedGame(heroGame)}
                className="px-5 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-sm tracking-wide transition-all border border-slate-700/80 active:scale-95 flex items-center space-x-2"
              >
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span>Save: {heroGame.metadata.originalSize} → {heroGame.metadata.repackSize}</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Popular Ranking Shelf (Horizontal Carousel) */}
      {!isLoading && games.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="w-2.5 h-6 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.5)]" />
              <h2 className="text-xl font-black text-white tracking-wider uppercase">
                Trending Top 8 Releases
              </h2>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => scrollShelf('left')}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all active:scale-95"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scrollShelf('right')}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all active:scale-95"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div
            ref={shelfRef}
            onWheel={handleHorizontalWheel}
            className="flex space-x-5 overflow-x-auto no-scrollbar scroll-smooth py-2"
          >
            {games.slice(0, 8).map((game) => (
              <div
                key={game.id}
                onClick={() => setSelectedGame(game)}
                className="group relative flex-none w-56 cursor-pointer rounded-2xl bg-slate-900 border border-slate-800/80 overflow-hidden transition-all duration-300 hover:scale-105 hover:border-sky-400/80 hover:shadow-[0_12px_32px_rgba(56,189,248,0.35)]"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950">
                  <img
                    src={game.logo}
                    alt={game.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                  {/* Rank Badge */}
                  {game.rank && (
                    <div
                      className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[11px] font-black tracking-wider uppercase shadow-md ${
                        game.rank === 1
                          ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black'
                          : game.rank === 2
                          ? 'bg-gradient-to-r from-slate-200 to-slate-400 text-black'
                          : game.rank === 3
                          ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white'
                          : 'bg-slate-950/90 text-sky-400 border border-sky-400/40'
                      }`}
                    >
                      #{game.rank}
                    </div>
                  )}

                  {/* Repack Size Badge */}
                  {game.metadata.repackSize && (
                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-slate-950/90 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">
                      {game.metadata.repackSize}
                    </div>
                  )}

                  {/* Magnet P2P Ready Badge */}
                  {game.magnetUrl && game.magnetUrl.length > 0 && (
                    <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center space-x-1 shadow-sm">
                      <Link2 className="w-3 h-3 text-emerald-400" />
                      <span>Magnet P2P</span>
                    </div>
                  )}

                  {/* Hover Actions */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/75 backdrop-blur-[2px] p-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedGame(game);
                      }}
                      className="w-full py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xs uppercase tracking-wider shadow-md active:scale-95"
                    >
                      View Specs
                    </button>
                    {game.magnetUrl && game.magnetUrl.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickDownloadMagnet(game);
                        }}
                        className="w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-md flex items-center justify-center space-x-1 active:scale-95"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-3.5 space-y-1">
                  <h3 className="text-sm font-bold text-white truncate group-hover:text-sky-400 transition-colors">
                    {game.name}
                  </h3>
                  <p className="text-xs text-slate-400 truncate">
                    {game.metadata.developer || 'Verified Repack'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main Catalog Section: Filter Toolbar + Game Grid */}
      {!isLoading && (
        <section className="space-y-6 pt-4 border-t border-slate-800/80">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <span className="w-2.5 h-6 rounded-full bg-sky-500 shadow-[0_0_12px_rgba(56,189,248,0.5)]" />
              <h2 className="text-xl font-black text-white tracking-wider uppercase">
                All Available Releases
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                {filteredGames.length} Games Found
              </span>
            </div>

            {/* Search Bar & Sort Dropdown */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[260px]">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search games, studios, tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                <ArrowUpDown className="w-4 h-4 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs font-medium focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="rank">Rank (Popularity)</option>
                  <option value="name">Title (A - Z)</option>
                  <option value="size_asc">Size: Smallest First</option>
                  <option value="size_desc">Size: Largest First</option>
                </select>
              </div>
            </div>
          </div>

          {/* Genre Pill Filter Buttons */}
          <div
            onWheel={handleHorizontalWheel}
            className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1"
          >
            <button
              onClick={() => setSelectedGenre('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedGenre === 'all'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                  : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
              }`}
            >
              All Genres
            </button>
            {allGenres.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  selectedGenre.toLowerCase() === genre.toLowerCase()
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                    : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>

          {/* Catalog 2:3 Capsule Grid */}
          {filteredGames.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800 space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-300">No games matched your criteria</h3>
              <p className="text-xs text-slate-500">
                Try modifying your search keywords or resetting your genre filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedGenre('all');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-6">
              {filteredGames.map((game) => (
                <div
                  key={game.id}
                  onClick={() => setSelectedGame(game)}
                  className="group relative cursor-pointer rounded-2xl bg-slate-900 border border-slate-800/80 overflow-hidden transition-all duration-300 hover:scale-105 hover:border-sky-400/80 hover:shadow-[0_12px_32px_rgba(56,189,248,0.35)]"
                >
                  {/* 2:3 Vertical Capsule Poster */}
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950">
                    <img
                      src={game.logo}
                      alt={game.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                    {/* Rank Badge */}
                    {game.rank && (
                      <div
                        className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[11px] font-black tracking-wider uppercase shadow-md ${
                          game.rank === 1
                            ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black'
                            : game.rank === 2
                            ? 'bg-gradient-to-r from-slate-200 to-slate-400 text-black'
                            : game.rank === 3
                            ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white'
                            : 'bg-slate-950/90 text-sky-400 border border-sky-400/40'
                        }`}
                      >
                        #{game.rank}
                      </div>
                    )}

                    {/* Repack Size Badge */}
                    {game.metadata.repackSize && (
                      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-slate-950/90 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">
                        {game.metadata.repackSize}
                      </div>
                    )}

                    {/* Magnet P2P Ready Badge */}
                    {game.magnetUrl && game.magnetUrl.length > 0 && (
                      <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center space-x-1 shadow-sm">
                        <Link2 className="w-3 h-3 text-emerald-400" />
                        <span>Magnet P2P</span>
                      </div>
                    )}

                    {/* Hover Inspect Glyph & Quick Download Action */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/75 backdrop-blur-[2px] p-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGame(game);
                        }}
                        className="w-full py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-sky-500/40 transition-all active:scale-95"
                      >
                        View Specs (A)
                      </button>
                      {game.magnetUrl && game.magnetUrl.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickDownloadMagnet(game);
                          }}
                          className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/40 transition-all flex items-center justify-center space-x-1.5 active:scale-95"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Torrent</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Card Meta Content */}
                  <div className="p-4 space-y-1.5">
                    <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-sky-400 transition-colors">
                      {game.name}
                    </h3>
                    <p className="text-xs text-slate-400 truncate">
                      {game.metadata.developer || 'Repack Release'}
                    </p>
                    {game.metadata.genres && (
                      <p className="text-[11px] text-slate-500 truncate">
                        {game.metadata.genres}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Floating Toast Notification */}
      {toastNotification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 px-5 py-3 rounded-2xl bg-slate-900 border border-emerald-500/60 shadow-2xl text-xs text-white animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-semibold">{toastNotification}</span>
          <button
            onClick={() => setCurrentTab('downloads')}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] transition-all shadow-md active:scale-95"
          >
            View Downloads
          </button>
          <button
            onClick={() => setToastNotification(null)}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Selected Game Modal */}
      <StoreGameModal game={selectedGame} onClose={() => setSelectedGame(null)} />
    </div>
  );
};
