import React, { useState } from 'react';
import { StoreGame } from '@/types/store';
import { useLibraryStore } from '@/stores/libraryStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProfileStore } from '@/stores/profileStore';
import { api } from '@/services/tauri';
import { Game } from '@/types';
import {
  X,
  PlusCircle,
  Download,
  ExternalLink,
  Cpu,
  HardDrive,
  Calendar,
  Layers,
  Globe,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Tag,
  Monitor,
  Flame,
  Copy,
  Check,
  Link2,
} from 'lucide-react';

interface StoreGameModalProps {
  game: StoreGame | null;
  onClose: () => void;
}

export const StoreGameModal: React.FC<StoreGameModalProps> = ({ game, onClose }) => {
  const { addGame, games } = useLibraryStore();
  const { activeProfile } = useProfileStore();
  const { setCurrentTab } = useNavigationStore();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isAdded, setIsAdded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedMagnetIndex, setCopiedMagnetIndex] = useState<number | null>(null);

  if (!game) return null;

  const handleCopyMagnet = (magnetUrl: string, index: number) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(magnetUrl);
      setCopiedMagnetIndex(index);
      setTimeout(() => setCopiedMagnetIndex(null), 2000);
    }
  };

  const allImages = game.images && game.images.length > 0 ? game.images : [game.logo];
  const activeImage = allImages[activeImageIndex] || game.logo;

  const isAlreadyInLibrary = games.some(
    (g) => g.title.toLowerCase() === game.name.toLowerCase()
  );

  const handleAddToLibrary = async () => {
    if (isAlreadyInLibrary) {
      alert(`"${game.name}" is already in your library!`);
      return;
    }

    const newGame: Game = {
      id: `store-${game.id}-${Date.now()}`,
      title: game.name,
      summary: game.description,
      developer: game.metadata.developer || 'Unknown Developer',
      publisher: game.metadata.publisher || 'Unknown Publisher',
      releaseDate: game.publishedAt ? game.publishedAt.split('T')[0] : '2026',
      source: 'local',
      platform: 'windows',
      coverUrl: game.logo,
      bannerUrl: game.images?.[0] || game.logo,
      installed: false,
      isFavorite: false,
      playtimeMinutes: 0,
      customCategory: 'Store Downloads',
    };

    await addGame(newGame);
    setIsAdded(true);
  };

  const parseRepackBytes = (repackSize?: string): number => {
    if (!repackSize) return 21474836480;
    const match = repackSize.match(/([\d.]+)\s*GB/i);
    if (match) {
      return Math.round(parseFloat(match[1]) * 1024 * 1024 * 1024);
    }
    const mbMatch = repackSize.match(/([\d.]+)\s*MB/i);
    if (mbMatch) {
      return Math.round(parseFloat(mbMatch[1]) * 1024 * 1024);
    }
    return 21474836480;
  };

  const handleQueueDownload = async () => {
    setIsDownloading(true);
    const estimatedBytes = parseRepackBytes(game.metadata.repackSize);

    try {
      if (game.magnetUrl && game.magnetUrl.length > 0) {
        await api.addTorrentTask(game.magnetUrl[0].magnetUrl, game.name, undefined, estimatedBytes);
      } else {
        await api.queueDownload(game.name, game.pageUrl || 'https://fitgirl-repacks.site', `~/Downloads/${game.name}`);
      }
      if (!isAlreadyInLibrary) {
        await handleAddToLibrary();
      }
      setTimeout(() => {
        setIsDownloading(false);
        setCurrentTab('downloads');
        onClose();
      }, 500);
    } catch (err: any) {
      console.warn('Queue download failed:', err);
      setIsDownloading(false);
      alert(`Could not start download: ${err?.message || err}`);
    }
  };

  const handleDownloadSpecificTorrent = async (magnetUrl: string, title: string) => {
    const estimatedBytes = parseRepackBytes(game.metadata.repackSize);
    try {
      await api.addTorrentTask(magnetUrl, `${game.name} (${title})`, undefined, estimatedBytes);
      if (!isAlreadyInLibrary) {
        await handleAddToLibrary();
      }
      setCurrentTab('downloads');
      onClose();
    } catch (err: any) {
      alert(`Could not queue torrent: ${err?.message || err}`);
    }
  };

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 md:p-8 select-none animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header Bar */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            {game.rank && (
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-black tracking-wider uppercase ${
                  game.rank === 1
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950'
                    : game.rank === 2
                    ? 'bg-gradient-to-r from-slate-200 to-slate-400 text-slate-950'
                    : game.rank === 3
                    ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white'
                    : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                }`}
              >
                Top #{game.rank} Popular
              </span>
            )}
            <h2 className="text-lg md:text-xl font-black text-white truncate max-w-lg">
              {game.name}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Screenshot Carousel */}
          <div className="relative w-full h-72 md:h-96 rounded-2xl overflow-hidden bg-black/60 border border-slate-800 shadow-xl group">
            <img
              src={activeImage}
              alt={game.name}
              className="w-full h-full object-cover transition-all duration-300"
            />

            {/* Gradient Overlay for bottom text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

            {/* Carousel navigation arrows */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-950/70 hover:bg-slate-900 border border-slate-700/60 text-white transition-transform active:scale-90"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-950/70 hover:bg-slate-900 border border-slate-700/60 text-white transition-transform active:scale-90"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Bottom thumbnail strip */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-12 h-8 rounded-lg overflow-hidden border-2 transition-all ${
                        activeImageIndex === idx
                          ? 'border-sky-400 scale-105 shadow-md shadow-sky-500/50'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="thumb" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Quick Stats Grid & Repack Compression Badge */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Repack Size Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/90 border border-sky-500/20 shadow-md">
              <div className="flex items-center space-x-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-2">
                <HardDrive className="w-4 h-4" />
                <span>Storage & Bandwidth</span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-white">
                  {game.metadata.repackSize || 'N/A'}
                </span>
                <span className="text-xs text-slate-400">download size</span>
              </div>
              {game.metadata.originalSize && (
                <div className="mt-2 text-xs text-emerald-400 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Unpacked original: {game.metadata.originalSize}</span>
                </div>
              )}
            </div>

            {/* Developer & Publisher Card */}
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-800">
              <div className="flex items-center space-x-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Layers className="w-4 h-4" />
                <span>Studio & Version</span>
              </div>
              <p className="text-sm font-bold text-white truncate">
                {game.metadata.developer || 'Independent'}
              </p>
              <p className="text-xs text-slate-400 truncate mt-1">
                {game.metadata.gameVersion || 'Latest Release'}
              </p>
            </div>

            {/* Languages Card */}
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-800">
              <div className="flex items-center space-x-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Globe className="w-4 h-4" />
                <span>Languages</span>
              </div>
              <p className="text-xs text-slate-300 font-mono truncate">
                {game.metadata.languages || 'English / Multi'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Full Audio + Subtitles</p>
            </div>
          </div>

          {/* Genre Chips */}
          {game.metadata.genres && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 flex items-center space-x-1 mr-1">
                <Tag className="w-3.5 h-3.5" />
                <span>Tags:</span>
              </span>
              {game.metadata.genres.split(',').map((genre, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-medium text-slate-300 border border-slate-700/60"
                >
                  {genre.trim()}
                </span>
              ))}
            </div>
          )}

          {/* About / Synopsis */}
          <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-800/80 space-y-3">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center space-x-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>About this Release</span>
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">{game.description}</p>
          </div>

          {/* Extended Paragraphs / Lore & Feature Notes */}
          {game.paragraphs && game.paragraphs.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Key Features & Details
              </h3>
              <div className="space-y-2">
                {game.paragraphs.map((p, idx) => (
                  <p key={idx} className="text-xs md:text-sm text-slate-300 leading-relaxed">
                    • {p}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* System Requirements */}
          {game.specifications && (game.specifications.minimum || game.specifications.recommended) && (
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center space-x-2">
                <Monitor className="w-4 h-4 text-sky-400" />
                <span>System Requirements</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {game.specifications.minimum && (
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                    <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider mb-2">
                      Minimum
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-mono">
                      {game.specifications.minimum}
                    </p>
                  </div>
                )}
                {game.specifications.recommended && (
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                    <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider mb-2">
                      Recommended
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-mono">
                      {game.specifications.recommended}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Magnet / Torrent Links */}
          {game.magnetUrl && game.magnetUrl.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center space-x-2">
                <Link2 className="w-4 h-4 text-emerald-400" />
                <span>P2P Repack Mirrors ({game.magnetUrl.length})</span>
              </h3>
              <div className="space-y-2">
                {game.magnetUrl.map((mirror, idx) => {
                  const isCopied = copiedMagnetIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-200 capitalize truncate">
                          {mirror.title || `Magnet Mirror #${idx + 1}`}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono truncate hidden sm:inline">
                          {mirror.magnetUrl.slice(0, 45)}...
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyMagnet(mirror.magnetUrl, idx)}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-sky-400" />
                              <span>Copy URI</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadSpecificTorrent(mirror.magnetUrl, mirror.title)}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
                          title="Queue Torrent in Download Manager"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Torrent</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => api.openInExternalTorrentClient(mirror.magnetUrl)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700"
                          title="Open in System Torrent Client"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="px-6 py-4 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>DRM-Free Compatible Catalog Entry</span>
          </div>

          <div className="flex items-center space-x-3">
            {game.pageUrl && (
              <a
                href={game.pageUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center space-x-1.5"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Official Page</span>
              </a>
            )}

            <button
              onClick={handleAddToLibrary}
              disabled={isAlreadyInLibrary || isAdded}
              className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all flex items-center space-x-2 ${
                isAlreadyInLibrary || isAdded
                  ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 active:scale-95'
              }`}
            >
              {isAlreadyInLibrary || isAdded ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>In Library</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Add to Vault</span>
                </>
              )}
            </button>

            <button
              onClick={handleQueueDownload}
              disabled={isDownloading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-black tracking-wider uppercase transition-all shadow-lg shadow-sky-500/25 active:scale-95 flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? 'Queuing...' : 'Download / Install'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

