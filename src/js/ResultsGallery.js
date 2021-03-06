// React
import React, { useContext } from 'react'

// Libraries
import { saveAs } from 'file-saver'

// Helpers
import { GlobalState } from './State'

// Style
import '../scss/ResultsGallery.scss'

/**
 * Sort anime by Elo.
 */
function eloSort([ , { elo: aElo} ], [ , { elo: bElo } ]) {
    return bElo - aElo
}

/**
 * Show a gallery of all the anime sorted by Elo.
 */
function ResultsGallery() {
    const { state: {
        username,
        animeObject,
        anime,
        isImportFinished,
        totalInitialPairs,
        manuallyEliminatedCount,
        autoEliminatedCountA,
        autoEliminatedCountB,
        completedTimestamp,
    } } = useContext(GlobalState)

    // Get all anime in an array form
    const allAnime = Object.entries(anime)

    // Format the timestamp of when the comparing was completed
    const completedString = new Intl.DateTimeFormat('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(completedTimestamp)

    // Callback to export all data as a JSON file
    const exportData = () => {
        // File name and type
        const fileName = `${username}-animesort-export.json`
        const fileType = 'application/json;charset=utf-8'

        // Make an object of all anime which also includes the anime title
        const exportAnime = allAnime.reduce((object, [ id, { elo, wonAgainst, lostTo } ]) => {
            // Anime for any reason not found in the anime object, maybe because it was imported with the wrong ID
            // or removed from the users list after this was exported
            if (!animeObject.hasOwnProperty(id)) {
                return object
            }

            object[id] = {
                title: animeObject[id].title,
                elo,
                wonAgainst,
                lostTo,
            }

            return object
        }, {})

        // All the data to save
        const data = JSON.stringify({
            username,
            anime: exportAnime,
            totalInitialPairs,
            manuallyEliminatedCount,
            autoEliminatedCountA,
            autoEliminatedCountB,
            completedTimestamp,
        })

        // Save it
        const blob = new Blob([ data ], { type: fileType })

        saveAs(blob, fileName)
    }

    return (
        <>
            <div className="container is-column">
                <h1>Here is {isImportFinished ? `${username}'s` : 'your'} sorted anime, enjoy!</h1>
                <p><strong>Comparison decisions {isImportFinished ? `${username}` : 'you\'ve'} made:</strong> {manuallyEliminatedCount.toLocaleString()}</p>
                <p><strong>Automatic decisions made:</strong> {(autoEliminatedCountA + autoEliminatedCountB).toLocaleString()}</p>
                <p><strong>Total pairs of anime compared:</strong> {totalInitialPairs.toLocaleString()}</p>
                <p><strong>Sorting completed on:</strong> {completedString}</p>
                <button className="gallery-export" onClick={exportData}>Export data as JSON</button>
            </div>
            <div className="gallery">
                {allAnime.sort(eloSort).map(([ id, { title = false, elo, wonAgainst, lostTo } ], index) =>
                    <GalleryItem
                        anime={animeObject.hasOwnProperty(id) ? animeObject[id] : false}
                        id={id}
                        title={title}
                        index={index}
                        elo={elo}
                        wonAgainst={wonAgainst.length}
                        lostTo={lostTo.length}
                        key={id}
                    />
                )}
            </div>
        </>
    )
}

/**
 * Single anime in the gallery.
 */
function GalleryItem({ anime, title, id, index, elo, wonAgainst, lostTo }) {
    const { state: { username } } = useContext(GlobalState)

    // Anime for any reason not found in the anime object, maybe because it was imported with the wrong ID
    // or removed from the users list after this was exported
    if (!anime) {
        return (
            <div className="gallery-item">
                {title
                    ? <p>Anime "{title}" wasn't found in {username}'s anime list.</p>
                    : <p>Anime with the ID "{id}" wasn't found in {username}'s anime list.</p>}
            </div>
        )
    }

    return (
        <div className="gallery-item">
            <img src={anime.image_url} height={225} width={150} alt={anime.title} />
            <h3><a href={anime.url} target="_blank" rel="noopener noreferrer">{anime.title}</a></h3>
            <p><strong>MyAnimeList rating:</strong> {anime.score}</p>
            <p><strong>Elo score:</strong> {elo.toLocaleString()} (#{index + 1})</p>
            <p>Won against <strong>{wonAgainst}</strong> and lost to <strong>{lostTo}</strong> anime</p>
        </div>
    )
}

// Exports
export {
    ResultsGallery,
}
