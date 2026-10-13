export interface LudopediaGameSummary {
    id: number;
    name: string;
    originalName: string | null;
    imageUrl: string | null;
    link: string | null;
}

export interface LudopediaGameSearch {
    games: LudopediaGameSummary[];
    total: number;
}

export interface LudopediaCatalogItem {
    id: number;
    name: string;
}

export interface LudopediaGameDetail {
    id: number;
    name: string;
    imageUrl: string | null;
    link: string | null;
    minPlayers: number | null;
    maxPlayers: number | null;
    playTimeMinutes: number | null;
    publishedYear: number | null;
    minAge: number | null;
    complexity: number | null;
    categories: LudopediaCatalogItem[];
    mechanics: LudopediaCatalogItem[];
}
