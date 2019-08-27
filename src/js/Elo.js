// Libraries
import clone from 'clone'
import shuffleArray from 'shuffle-array'

// Factor used in the Elo formula
const kFactor = 32

/**
 * Compares 2 anime against each other.
 */
function compare(allAnime, winnerId, loserId) {
    // Make a copy of all anime to not affect state
    const anime = clone(allAnime, false)

    // Count of how many anime were auto-eliminated
    let autoEliminatedCountA = 0
    let autoEliminatedCountB = 0

    // Update the Elo of 2 anime, where one anime is the winner and the other is a loser
    function updateElo(eloWinnerId, eloLoserId) {
        // Get current Elo
        const winnerElo = anime[eloWinnerId].elo
        const loserElo = anime[eloLoserId].elo

        // Get expected scores
        const winnerExpected = getExpected(winnerElo, loserElo)
        const loserExpected = getExpected(loserElo, winnerElo)

        // Update the Elo of winner and loser and record this match
        anime[eloWinnerId].elo = getNewElo(winnerExpected, 1, winnerElo)
        anime[eloWinnerId].wonAgainst.push(eloLoserId)

        anime[eloLoserId].elo = getNewElo(loserExpected, 0, loserElo)
        anime[eloLoserId].lostTo.push(eloWinnerId)

        // Make all losers of the current loser lose against the current winner
        for (const subLoserId of anime[eloLoserId].wonAgainst) {
            // Ignore if winner already won or lost
            if (anime[eloWinnerId].wonAgainst.includes(subLoserId) || anime[eloWinnerId].lostTo.includes(subLoserId)) {
                continue
            }

            // Ignore same IDs
            if (subLoserId === eloWinnerId || subLoserId === eloLoserId) {
                continue
            }

            updateElo(eloWinnerId, subLoserId)

            // Keep count of how many were automatically eliminated this way
            autoEliminatedCountA += 1
        }

        // Make all winners over the current winner win against the current loser
        for (const supWinnerId of anime[eloWinnerId].lostTo) {
            // Ignore if winner already won or lost
            if (anime[supWinnerId].wonAgainst.includes(eloLoserId) || anime[supWinnerId].lostTo.includes(eloLoserId)) {
                continue
            }

            // Ignore same IDs
            if (supWinnerId === eloWinnerId || supWinnerId === eloLoserId) {
                continue
            }

            updateElo(supWinnerId, eloLoserId)

            // Keep count of how many were automatically eliminated this way
            autoEliminatedCountB += 1
        }

        return true
    }

    updateElo(winnerId, loserId)

    // Return all updated anime and comparisons
    return [
        anime,
        autoEliminatedCountA,
        autoEliminatedCountB,
    ]
}

/**
 * Returns the total numbers of pairs remaining and a random pair for comparison.
 */
function getComparisonPairs(allAnime) {
    // Array of all possible pairs
    const pairs = []

    // Array of all anime IDs
    const animeIds = Object.keys(allAnime)

    // Cache total number of anime IDs to loop through
    const total = animeIds.length

    // Go through each anime (outer)
    for (let i = 0; i < total; i += 1) {
        // Go through each other anime in front of this one (inner)
        for (let j = i + 1; j < total; j += 1) {
            // IDs of the outer and inner anime
            const outerAnimeId = parseInt(animeIds[i], 10)
            const innerAnimeId = parseInt(animeIds[j], 10)

            // Object of the outer anime
            const outerAnime = allAnime[outerAnimeId]

            // Don't include this pair if they've already been compared
            if (outerAnime.wonAgainst.includes(innerAnimeId) || outerAnime.lostTo.includes(innerAnimeId)) {
                continue
            }

            pairs.push([ outerAnimeId, innerAnimeId ])
        }
    }

    // No more pairs left for comparison
    if (!pairs.length) {
        return [
            0,
            pairs,
        ]
    }

    // Get a random index to return a random pair
    const randomIndex = randomBetween(0, pairs.length - 1)

    // Return the total number of pairs left and a random pair
    return [
        pairs.length,
        shuffleArray(pairs[randomIndex]),
    ]
}

/**
 * Returns a random number between min and max, inclusive.
 */
function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

/**
 * Return the expected score based on A's and B's Elo.
 */
function getExpected(aElo, bElo) {
    return 1 / (1 + Math.pow(10, (bElo - aElo) / 400))
}

/**
 * Return the new Elo based on the expected score, actual outcome (1 for win, 0 for loss), and the current Elo.
 */
function getNewElo(expected, actual, current) {
    return Math.round(current + kFactor * (actual - expected))
}

// Exports
export {
    compare,
    getComparisonPairs,
}
