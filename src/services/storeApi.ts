import { StoreApiResponse, StoreGame } from '@/types/store';
import { MOCK_STORE_GAMES } from '@/data/mockStoreGames';

const STORE_API_URL = 'https://game-backend-api-7dx4.onrender.com/api/games';
const CACHE_KEY = 'universal_game_hub_store_cache';
const CACHE_TIME_KEY = 'universal_game_hub_store_cache_time';
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

export interface StoreFetchResult {
  games: StoreGame[];
  totalGames: number;
  source: string;
  scrapedAt?: string;
  isFromCache: boolean;
  error?: string;
}

export async function fetchStoreCatalog(forceRefresh: boolean = false): Promise<StoreFetchResult> {
  // 1. Check local cache if not forcing refresh
  if (!forceRefresh && typeof window !== 'undefined') {
    try {
      const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
      const cachedData = localStorage.getItem(CACHE_KEY);

      if (cachedData && cachedTime) {
        const age = Date.now() - parseInt(cachedTime, 10);
        if (age < CACHE_TTL_MS) {
          const parsed = JSON.parse(cachedData) as StoreApiResponse;
          if (parsed && Array.isArray(parsed.games) && parsed.games.length > 0) {
            return {
              games: parsed.games,
              totalGames: parsed.totalGames || parsed.games.length,
              source: parsed.source || STORE_API_URL,
              scrapedAt: parsed.scrapedAt,
              isFromCache: true,
            };
          }
        }
      }
    } catch (e) {
      console.warn('Failed reading store cache from localStorage:', e);
    }
  }

  // 2. Fetch fresh catalog from live API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout (Render cold starts)

    const response = await fetch(STORE_API_URL, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Store API returned status HTTP ${response.status}`);
    }

    const data: StoreApiResponse = await response.json();

    if (data && Array.isArray(data.games) && data.games.length > 0) {
      // Save to localStorage cache
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
      } catch (err) {
        console.warn('LocalStorage store cache quota warning:', err);
      }

      return {
        games: data.games,
        totalGames: data.totalGames || data.games.length,
        source: data.source || STORE_API_URL,
        scrapedAt: data.scrapedAt,
        isFromCache: false,
      };
    }

    throw new Error('Store API returned empty game list');
  } catch (err: any) {
    console.warn('Live store API fetch failed, checking fallback cache:', err);

    // 3. Fallback: Check expired local storage cache
    if (typeof window !== 'undefined') {
      try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const parsed = JSON.parse(cachedData) as StoreApiResponse;
          if (parsed && Array.isArray(parsed.games) && parsed.games.length > 0) {
            return {
              games: parsed.games,
              totalGames: parsed.totalGames || parsed.games.length,
              source: parsed.source || STORE_API_URL,
              scrapedAt: parsed.scrapedAt,
              isFromCache: true,
              error: err?.message || 'Loaded from local offline cache',
            };
          }
        }
      } catch (e) {
        // ignore
      }
    }

    // 4. Ultimate fallback: static mock data
    return {
      games: MOCK_STORE_GAMES,
      totalGames: MOCK_STORE_GAMES.length,
      source: 'Offline Fallback Catalog',
      isFromCache: true,
      error: err?.message || 'Using bundled catalog',
    };
  }
}

