// Libraries
import clone from 'clone'
import shuffleArray from 'shuffle-array'

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
function getComparisonPairs(allAnime, previousPair) {
    // Make a copy of all anime to not affect state
    // Shuffle that array to keep things fresh
    const anime = shuffleArray(Object.entries(clone(allAnime, false)))
        // Make the ID a number again (object keys are strings)
        .map(([ id, data ]) => [ parseInt(id, 10), data ])
        // Sort by total number of wins + losses
        .sort(([ , { wonAgainst: aWonAgainst, lostTo: aLostTo }], [ , { wonAgainst: bWonAgainst, lostTo: bLostTo } ]) => {
            return (aWonAgainst.length + aLostTo.length) - (bWonAgainst.length + bLostTo.length)
        })

    // Array of all possible pairs
    const pairs = []

    // Total number of anime to loop through
    const total = anime.length

    // Lowest number an anime has won + lost
    const [ lowestTotal ] = anime.map(([ , { wonAgainst, lostTo }]) => wonAgainst.length + lostTo.length).sort((a, b) => a - b)

    // Go through each anime (outer)
    for (let i = 0; i < total; i += 1) {
        // Outer anime ID and data
        const [ outerId, outerAnime ] = anime[i]

        // Go through each other anime in front of this one (inner)
        for (let j = i + 1; j < total; j += 1) {
            // Inner anime ID
            const [ innerId ] = anime[j]

            // Don't include this pair if they've already been compared
            if (outerAnime.wonAgainst.includes(innerId) || outerAnime.lostTo.includes(innerId)) {
                continue
            }

            pairs.push([ outerId, innerId ])
        }
    }

    // Total number of pairs generated
    const totalPairs = pairs.length

    // No more pairs left for comparison
    if (!totalPairs) {
        return [
            totalPairs,
            pairs,
        ]
    }

    // Try to get a valid pair of anime
    let randomPair
    let isValidPair = false
    let pairTries = 0

    // Try to find a valid pair
    do {
        // Get a pair
        randomPair = pairs[pairTries]

        // First, make sure all anime have been compared with another anime at least once
        if (lowestTotal === 0) {
            isValidPair = randomPair.every(animeId => isValidPairItem(allAnime[animeId], lowestTotal))

        // Then, make sure at least one anime out of the pair has been compared the fewest number of times in total
        } else {
            isValidPair = randomPair.some(animeId => isValidPairItem(allAnime[animeId], lowestTotal))
        }

        // Try not to show the same anime two times in a row
        if (previousPair && randomPair.some(animeId => previousPair.includes(animeId))) {
            isValidPair = false
        }

        // Prevent infinite loops
        pairTries += 1

        // No valid pair found, return the first one instead as it's the most likely to have the fewest compared anime
        if (pairTries === totalPairs - 1) {
            randomPair = pairs[0]
            isValidPair = true
        }
    } while (!isValidPair)

    // Return the total number of pairs left and a random pair
    return [
        totalPairs,
        shuffleArray(randomPair),
    ]
}

/**
 * Returns whether the anime from a pair has less or equal to the lowest total wins + losses
 */
function isValidPairItem(animeData, lowestTotal) {
    return (animeData.wonAgainst.length + animeData.lostTo.length) <= lowestTotal
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
    const kFactor = getKFactor(current)

    return Math.round(current + kFactor * (actual - expected))
}

/**
 * Return's a K-factor to use based on current Elo
 */
function getKFactor(elo) {
    if (elo > 2400) {
        return 16
    } else if (elo > 2100) {
        return 24
    }

    return 32
}

// Exports
export {
    compare,
    getComparisonPairs,
}
