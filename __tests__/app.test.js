/**
 * Unit Tests for RetroMZ
 * Tests pure utility functions used throughout the application.
 */

// Utility: formatRating
function formatRating(rating) {
    if (typeof rating !== 'number' || rating < 0 || rating > 5)
        throw new Error('Rating must be a number between 0 and 5');
    return rating.toFixed(1);
}

// Utility: slugToTitle
function slugToTitle(slug) {
    if (!slug || typeof slug !== 'string') return '';
    return slug
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

// Utility: filterGamesBySystem
function filterGamesBySystem(games, system) {
    if (!Array.isArray(games)) return [];
    return games.filter(g => g.system === system);
}

// Utility: getTopRated
function getTopRated(games, limit = 3) {
    return [...games]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, limit);
}


// Test Suite
describe('RetroMZ Utility Functions', () => {

    // formatRating tests
    describe('formatRating', () => {
        test('formats a valid rating to one decimal place', () => {
            expect(formatRating(4.8)).toBe('4.8');
        });

        test('formats integer rating to one decimal', () => {
            expect(formatRating(5)).toBe('5.0');
        });

        test('throws error for rating above 5', () => {
            expect(() => formatRating(6)).toThrow();
        });

        test('throws error for negative rating', () => {
            expect(() => formatRating(-1)).toThrow();
        });
    });

    // slugToTitle tests
    describe('slugToTitle', () => {
        test('converts slug to title case', () => {
            expect(slugToTitle('super-mario-bros')).toBe('Super Mario Bros');
        });

        test('handles single word slug', () => {
            expect(slugToTitle('pokemon')).toBe('Pokemon');
        });

        test('returns empty string for null input', () => {
            expect(slugToTitle(null)).toBe('');
        });
    });

    // filterGamesBySystem tests
    describe('filterGamesBySystem', () => {
        const games = [
            { title: 'Super Mario Bros', system: 'NES', rating: 4.8 },
            { title: 'Pokemon Ruby', system: 'GBA', rating: 4.7 },
            { title: 'Zelda', system: 'NES', rating: 4.9 },
        ];

        test('filters games by system', () => {
            expect(filterGamesBySystem(games, 'NES')).toHaveLength(2);
        });

        test('returns empty array for unknown system', () => {
            expect(filterGamesBySystem(games, 'PS5')).toHaveLength(0);
        });

        test('returns empty array for non-array input', () => {
            expect(filterGamesBySystem(null, 'NES')).toHaveLength(0);
        });
    });

    // getTopRated tests
    describe('getTopRated', () => {
        const games = [
            { title: 'Mario', rating: 4.8 },
            { title: 'Zelda', rating: 4.9 },
            { title: 'Pokemon', rating: 4.7 },
            { title: 'Metroid', rating: 4.5 },
        ];

        test('returns top 3 games by rating', () => {
            const top = getTopRated(games);
            expect(top).toHaveLength(3);
            expect(top[0].title).toBe('Zelda');
        });

        test('respects custom limit', () => {
            expect(getTopRated(games, 2)).toHaveLength(2);
        });
    });

});
