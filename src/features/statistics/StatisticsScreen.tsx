import React, { useState, useEffect } from 'react';
import { useLibraryStore } from '@/stores/libraryStore';
import { useProfileStore } from '@/stores/profileStore';
import { api, ProfileStatisticsDto } from '@/services/tauri';
import {
  BarChart2,
  Clock,
  Gamepad2,
  TrendingUp,
  HardDrive,
  Trophy,
} from 'lucide-react';

export const StatisticsScreen: React.FC = () => {
  const { games } = useLibraryStore();
  const { activeProfile } = useProfileStore();
  const [stats, setStats] = useState<ProfileStatisticsDto | null>(null);

  useEffect(() => {
    if (!activeProfile) return;
    const fetchStats = async () => {
      try {
        const res = await api.getProfileStatistics(activeProfile.id);
        setStats(res);
      } catch (err) {
        console.error('Failed to load profile statistics:', err);
      }
    };
    fetchStats();
  }, [activeProfile?.id, games.length]);

  const totalPlaytime = stats ? stats.total_playtime_minutes : games.reduce((acc, g) => acc + (g.playtimeMinutes || 0), 0);
  const totalHours = Math.round(totalPlaytime / 60);

  const mostPlayed = stats?.top_played_games && stats.top_played_games.length > 0
    ? stats.top_played_games
    : [...games]
        .filter((g) => (g.playtimeMinutes || 0) > 0)
        .sort((a, b) => (b.playtimeMinutes || 0) - (a.playtimeMinutes || 0))
        .slice(0, 5)
        .map((g) => ({
          id: g.id,
          title: g.title,
          playtime_minutes: g.playtimeMinutes || 0,
          cover_url: g.coverUrl,
        }));

  const platformCounts: Record<string, number> = stats?.platform_breakdown || games.reduce<Record<string, number>>((acc, g) => {
    acc[g.platform] = (acc[g.platform] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none">
      {/* Top Header */}
      <div className="px-8 pt-6 pb-4 bg-[#0b0e14] border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">Playtime & Statistics</h1>
            <p className="text-xs text-slate-400">
              Verified gameplay metrics, platform distribution, and session history.
            </p>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 max-w-5xl">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-100">{totalHours} Hours</div>
              <div className="text-xs text-slate-400">Total Tracked Playtime</div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/15 text-sky-400 flex items-center justify-center">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-100">{games.length} Titles</div>
              <div className="text-xs text-slate-400">Total Unified Games</div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-100">
                {mostPlayed[0]?.title || 'None yet'}
              </div>
              <div className="text-xs text-slate-400">Top Played Title</div>
            </div>
          </div>
        </div>

        {/* Most Played Games Ranking */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="font-bold text-slate-100 text-sm flex items-center">
            <TrendingUp className="w-4 h-4 text-emerald-400 mr-2" />
            <span>Most Played Titles</span>
          </h3>

          {mostPlayed.length > 0 ? (
            <div className="space-y-2.5">
              {mostPlayed.map((game, index) => {
                const playtimeMins = (game as any).playtime_minutes ?? (game as any).playtimeMinutes ?? 0;
                const cover = (game as any).cover_url ?? (game as any).coverUrl;
                const hours = (playtimeMins / 60).toFixed(1);
                const percent = totalHours > 0 ? (playtimeMins / (totalPlaytime || 1)) * 100 : 0;

                return (
                  <div
                    key={game.id}
                    className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3.5">
                      <span className="w-6 text-center font-mono font-bold text-slate-500 text-xs">
                        #{index + 1}
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-slate-900 overflow-hidden shrink-0">
                        {cover ? (
                          <img src={cover} alt={game.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600 text-[10px]">
                            🎮
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200">{game.title}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-400">{hours} hrs</div>
                      <div className="text-[10px] text-slate-500 font-mono">{percent.toFixed(0)}% of total</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              No playtime recorded yet. Play games from your library to track playtime accurately.
            </div>
          )}
        </div>

        {/* Platform Breakdown */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="font-bold text-slate-100 text-sm flex items-center">
            <HardDrive className="w-4 h-4 text-sky-400 mr-2" />
            <span>Games by Platform</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Object.entries(platformCounts).map(([platform, count]) => (
              <div
                key={platform}
                className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
              >
                <span className="text-xs font-semibold text-slate-300 capitalize">{platform}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-sky-400 font-mono text-xs font-bold">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

