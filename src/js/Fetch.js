async function getAnimeList(username, page = 1, isRetry = false) {
    // Collect API data
    let apiData = []

    // Stop after too many retries
    if (isRetry > 5) {
        throw new Error('Too many API retries')
    }

    // Wait at least 2 seconds between API requests, increasing with each retry
    if (page > 1 || isRetry) {
        await new Promise(resolve => {
            setTimeout(resolve, (isRetry || 1) * 2000)
        })
    }

    // Get the data
    let response

    try {
        response = await fetch(`https://api.jikan.moe/v3/user/${username}/animelist/all/${page}`)
    } catch (error) {
        console.warn('Error occurred while fetching API, retrying')

        apiData = apiData.concat(await getAnimeList(username, page, isRetry ? isRetry + 1 : 1))
    }

    // Re-try if failed because of too many requests
    if (response.status === 429) {
        console.warn('API responded with 429 Too Many Requests status, retrying')

        apiData = apiData.concat(await getAnimeList(username, page, isRetry ? isRetry + 1 : 1))

    // Abort for any other error
    } else if (response.status !== 200) {
        throw new Error('API responded with non-200 and non-429 status, aborting')
    }

    // Parse JSON response
    let responseJson

    try {
        responseJson = await response.json()
    } catch (error) {
        throw new Error('Could not parse API data')
    }

    if (!responseJson.hasOwnProperty('anime') || !Array.isArray(responseJson.anime) || !responseJson.anime.length) {
        throw new Error('Anime data not found in API data')
    }

    // Add all anime from API
    apiData.push(...responseJson.anime)

    // If this page was full (300 entries per page), get the next page
    if (responseJson.anime.length === 300) {
        apiData = apiData.concat(await getAnimeList(username, page + 1))
    }

    return apiData
}

/**
 * Validates that the imported data is correct.
 */
function validateImportData(importData) {
    // List of required properties and their types
    const requiredProps = {
        username: 'string',
        anime: 'object',
        totalInitialPairs: 'number',
        manuallyEliminatedCount: 'number',
        autoEliminatedCountA: 'number',
        autoEliminatedCountB: 'number',
        completedTimestamp: 'number',
    }

    // Check for all required properties and make sure they are the right type
    for (const [ propName, propType ] of Object.entries(requiredProps)) {
        if (!importData.hasOwnProperty(propName) || typeof importData[propName] !== propType) {
            return false
        }
    }

    // Regex to simply match anime ID which is all numbers
    const number = /^\d+$/

    const anime = Object.entries(importData.anime)

    // Check for empty anime object
    if (!anime.length) {
        return false
    }

    // Make sure the anime array is correct
    return anime.every(([ id, data ]) => {
        if (!number.test(id)) {
            return false
        }

        if (!data.hasOwnProperty('elo') || typeof data.elo !== 'number') {
            return false
        }

        if (!data.hasOwnProperty('wonAgainst') || !Array.isArray(data.wonAgainst)) {
            return false
        }

        if (!data.hasOwnProperty('lostTo') || !Array.isArray(data.lostTo)) {
            return false
        }

        // Make sure won and lost are arrays of numbers
        const wonAgainstValid = data.wonAgainst.every(id => typeof id === 'number')
        const lostToValid = data.lostTo.every(id => typeof id === 'number')

        return wonAgainstValid && lostToValid
    })
}

// Exports
export {
    getAnimeList,
    validateImportData,
}
