import type {
    LudopediaCatalogItem,
    LudopediaGameDetail,
    LudopediaGameSearch,
} from '../../Domain/Ludopedia/LudopediaCatalog.js';

export function toLudopediaGameSearchResponse(result: LudopediaGameSearch) {
    return {
        games: result.games.map((game) => ({
            id: game.id,
            name: game.name,
            originalName: game.originalName,
            imageUrl: game.imageUrl,
            link: game.link,
        })),
        total: result.total,
    };
}

export function toLudopediaGameResponse(game: LudopediaGameDetail) {
    return {
        id: game.id,
        name: game.name,
        imageUrl: game.imageUrl,
        link: game.link,
        minPlayers: game.minPlayers,
        maxPlayers: game.maxPlayers,
        playTimeMinutes: game.playTimeMinutes,
        publishedYear: game.publishedYear,
        minAge: game.minAge,
        complexity: game.complexity,
        categories: game.categories.map(toNamedItem),
        mechanics: game.mechanics.map(toNamedItem),
    };
}

export function toLudopediaCategoriesResponse(
    categories: readonly LudopediaCatalogItem[],
) {
    return { categories: categories.map(toNamedItem) };
}

export function toLudopediaMechanicsResponse(
    mechanics: readonly LudopediaCatalogItem[],
) {
    return { mechanics: mechanics.map(toNamedItem) };
}

function toNamedItem(item: LudopediaCatalogItem) {
    return { id: item.id, name: item.name };
}
