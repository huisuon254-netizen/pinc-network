import { useState, useEffect, useCallback, useRef } from 'react';
import { useI18n } from '../../i18n';
import { Hammer, Gamepad2, Swords, Trophy, Rocket, Plus, Play, Star, Users, X, Search, ChevronLeft, ChevronRight, RefreshCw, Clock, Award } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

type Tab = 'games' | 'duels' | 'arena' | 'tournaments';
type GameCategory = 'all' | 'racing' | 'action' | 'sports' | 'strategy' | 'puzzle' | 'survival' | 'multiplayer';

interface Game {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  url: string;
  category: string;
  provider: string;
  rating: number;
  plays: number;
}

interface GameProgress {
  id: string;
  user_id: string;
  game_id: string;
  provider: string;
  high_score: number;
  total_plays: number;
  total_time_secs: number;
  last_played: number;
  achievements: string;
}

const GAME_CATEGORIES: { id: GameCategory; i18nKey: string }[] = [
  { id: 'all', i18nKey: 'forge.cat_all' },
  { id: 'racing', i18nKey: 'forge.cat_racing' },
  { id: 'action', i18nKey: 'forge.cat_action' },
  { id: 'sports', i18nKey: 'forge.cat_sports' },
  { id: 'strategy', i18nKey: 'forge.cat_strategy' },
  { id: 'puzzle', i18nKey: 'forge.cat_puzzle' },
  { id: 'survival', i18nKey: 'forge.cat_survival' },
  { id: 'multiplayer', i18nKey: 'forge.cat_multiplayer' },
];

export default function ForgePage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>('games');
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [category, setCategory] = useState<GameCategory>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [gameProgress, setGameProgress] = useState<Record<string, GameProgress>>({});
  const [userId, setUserId] = useState<string>('');
  const playStartTime = useRef<number>(0);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const identity = await invoke<{ id: string } | null>('cmd_get_identity');
        if (identity) setUserId(identity.id);
      } catch (e) {
        console.error('Failed to load identity:', e);
      }
    };
    loadUser();
  }, []);

  const fetchGames = useCallback(async (cat: GameCategory, pg: number) => {
    setLoading(true);
    try {
      const g = await invoke<Game[]>('cmd_get_games', {
        category: cat === 'all' ? null : cat,
        page: pg,
        perPage: 24,
      });
      setGames(g);
      if (g.length < 24) setTotalPages(pg);
      else if (pg >= totalPages) setTotalPages(pg + 1);
    } catch (e) {
      console.error('Failed to fetch games:', e);
    } finally {
      setLoading(false);
    }
  }, [totalPages]);

  useEffect(() => {
    fetchGames(category, page);
  }, [category, page]);

  const handleCategoryChange = (cat: GameCategory) => {
    setCategory(cat);
    setPage(1);
    setTotalPages(1);
  };

  const filteredGames = games.filter(g =>
    search === '' ||
    g.title.toLowerCase().includes(search.toLowerCase()) ||
    g.description.toLowerCase().includes(search.toLowerCase()) ||
    g.category.toLowerCase().includes(search.toLowerCase())
  );

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'games', label: t('forge.games'), icon: <Gamepad2 size={14} /> },
    { id: 'duels', label: t('forge.duels'), icon: <Swords size={14} /> },
    { id: 'arena', label: t('forge.arena'), icon: <Trophy size={14} /> },
    { id: 'tournaments', label: t('forge.tournaments'), icon: <Trophy size={14} /> },
  ];

  const handlePlayGame = (game: Game) => {
    playStartTime.current = Date.now();
    setSelectedGame(game);
  };

  const handleCloseGame = async () => {
    if (selectedGame && userId && playStartTime.current > 0) {
      const elapsed = Math.floor((Date.now() - playStartTime.current) / 1000);
      try {
        const progress = await invoke<GameProgress>('cmd_save_game_progress', {
          userId,
          gameId: selectedGame.id,
          provider: selectedGame.provider,
          score: 0,
          timeSecs: elapsed,
        });
        setGameProgress(prev => ({ ...prev, [selectedGame.id]: progress }));
      } catch (e) {
        console.error('Failed to save progress:', e);
      }
    }
    playStartTime.current = 0;
    setSelectedGame(null);
  };

  if (selectedGame) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        <div className="h-12 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Gamepad2 size={18} className="text-purple-400" />
            <span className="text-sm font-bold">{selectedGame.title}</span>
            <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 uppercase tracking-widest">
              {selectedGame.provider}
            </span>
            <span className="text-[10px] bg-purple-900/50 px-2 py-0.5 rounded text-purple-300 uppercase tracking-widest">
              {selectedGame.category}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={selectedGame.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
              title="Open in browser"
            >
              <RefreshCw size={16} />
            </a>
            <button
              onClick={handleCloseGame}
              className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="flex-1 bg-zinc-950 relative">
          <iframe
            src={selectedGame.provider === 'GameDistribution'
              ? `${selectedGame.url}?gd_sdk_referrer_url=${encodeURIComponent(window.location.href)}`
              : selectedGame.url}
            className="w-full h-full border-none"
            allow="autoplay; fullscreen; keyboard; gamepad"
            title={selectedGame.title}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: '0.25rem' }}>
          {t('forge.subtitle')}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{t('forge.title')}</div>
          <span className="badge badge-purple">{t('forge.phase')}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {tabs.map((tabItem) => (
          <button
            key={tabItem.id}
            onClick={() => setTab(tabItem.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: tab === tabItem.id ? '1px solid var(--electric-blue)' : '1px solid var(--border)',
              background: tab === tabItem.id ? 'rgba(0,212,255,0.08)' : 'transparent',
              color: tab === tabItem.id ? 'var(--electric-blue)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.72rem',
              fontWeight: 600,
              transition: 'all 0.12s',
            }}
          >
            {tabItem.icon}
            {tabItem.label}
          </button>
        ))}
      </div>

      {tab === 'games' ? (
        <>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search games..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pinc-input"
                style={{ paddingLeft: '32px', width: '100%', fontSize: '0.72rem' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', flex: 1 }}>
              {GAME_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '4px',
                    border: category === cat.id ? '1px solid var(--neon-cyan)' : '1px solid var(--border)',
                    background: category === cat.id ? 'rgba(0,255,204,0.08)' : 'transparent',
                    color: category === cat.id ? 'var(--neon-cyan)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    transition: 'all 0.12s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t(cat.i18nKey)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading ? (
              Array(8).fill(0).map((_, i) => (
                <div key={i} className="h-64 bg-zinc-900/50 rounded-xl animate-pulse" />
              ))
            ) : filteredGames.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Gamepad2 size={48} className="mx-auto mb-4 opacity-30 text-zinc-600" />
                <div className="text-zinc-500 text-sm">No games found</div>
                <button
                  onClick={() => { setSearch(''); setCategory('all'); setPage(1); }}
                  className="mt-3 pinc-btn pinc-btn-primary text-xs"
                >
                  <RefreshCw size={12} /> Reset Filters
                </button>
              </div>
            ) : (
              filteredGames.map((game) => (
                <div
                  key={game.id}
                  className="group bg-zinc-900/40 border border-zinc-800/50 rounded-xl overflow-hidden hover:border-purple-500/50 hover:bg-zinc-900/80 transition-all duration-300 flex flex-col"
                >
                  <div className="relative aspect-video overflow-hidden bg-black">
                    <img
                      src={game.thumbnail}
                      alt={game.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 320"><rect fill="%2318181b" width="480" height="320"/><text x="50%" y="50%" fill="%2371717a" font-size="16" text-anchor="middle" dy=".3em">No Image</text></svg>';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => handlePlayGame(game)}
                        className="bg-purple-600 hover:bg-purple-500 text-white p-3 rounded-full transform scale-90 group-hover:scale-100 transition-all duration-300"
                      >
                        <Play size={24} fill="currentColor" />
                      </button>
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1">
                      <span className="bg-black/70 backdrop-blur-md text-[10px] px-2 py-0.5 rounded border border-white/10 text-white font-medium">
                        {game.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-sm text-zinc-100 group-hover:text-purple-400 transition-colors line-clamp-1">
                        {game.title}
                      </h3>
                    </div>
                    <p className="text-xs text-zinc-500 line-clamp-2 mb-4 flex-1">
                      {game.description}
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-800/50">
                      <div className="flex items-center gap-3 text-[10px] text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Star size={10} className="text-yellow-500" />
                          {game.rating.toFixed(1)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={10} />
                          {game.plays >= 1000000 ? `${(game.plays / 1000000).toFixed(1)}M` : `${(game.plays / 1000).toFixed(0)}K`}
                        </span>
                        {gameProgress[game.id] && (
                          <>
                            <span className="flex items-center gap-1 text-purple-400">
                              <Award size={10} />
                              {gameProgress[game.id].high_score}
                            </span>
                            <span className="flex items-center gap-1 text-cyan-400">
                              <Clock size={10} />
                              {Math.floor(gameProgress[game.id].total_time_secs / 60)}m
                            </span>
                          </>
                        )}
                      </div>
                      <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold">
                        {game.provider}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="pinc-btn pinc-btn-secondary"
                style={{ opacity: page <= 1 ? 0.4 : 1, fontSize: '0.72rem' }}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <span className="text-xs text-zinc-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages}
                className="pinc-btn pinc-btn-secondary"
                style={{ opacity: page >= totalPages ? 0.4 : 1, fontSize: '0.72rem' }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="pinc-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{t(`forge.${tab}`)}</div>
            <button
              className="pinc-btn pinc-btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem' }}
            >
              <Plus size={14} />
              {t('forge.create')}
            </button>
          </div>

          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
            <Hammer size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
            <div>{t('forge.noItems')}</div>
            <button
              className="pinc-btn pinc-btn-primary"
              style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '6px', margin: '1rem auto 0', fontSize: '0.72rem' }}
            >
              <Rocket size={14} />
              {t('forge.deploy')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
