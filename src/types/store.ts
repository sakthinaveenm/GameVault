export interface StoreGameMetadata {
  developer?: string | null;
  publisher?: string | null;
  genres?: string;
  languages?: string;
  gameVersion?: string | null;
  originalSize?: string;
  repackSize?: string;
  downloadSize?: string;
}

export interface StoreGameSpecifications {
  minimum?: string | null;
  recommended?: string | null;
}

export interface StoreGameMagnet {
  title: string;
  magnetUrl: string;
}

export interface StoreGame {
  id: number | string;
  rank?: number;
  name: string;
  logo: string;
  images: string[];
  description: string;
  pageUrl?: string;
  publishedAt?: string;
  metadata: StoreGameMetadata;
  specifications?: StoreGameSpecifications;
  magnetUrl?: StoreGameMagnet[];
  paragraphs?: string[];
}

export interface StoreApiResponse {
  success: boolean;
  source?: string;
  rankingPage?: string;
  scrapedAt?: string;
  requestedGames?: number;
  candidateGames?: number;
  totalGames?: number;
  complete?: boolean;
  games: StoreGame[];
}
