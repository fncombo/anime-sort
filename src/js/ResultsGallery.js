// React
import React, { useContext, useState } from 'react'

// Libraries
import clone from 'clone'
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

    // Whether to show suggested rating distributions
    const [ showRatings, setShowRatings ] = useState(false)

    // Get all anime in an array form
    const allAnime = Object.entries(anime)

    // Save each anime's index relative to all anime after being sorted by Elo
    const indexedAnime = clone(allAnime).sort(eloSort).map((animeObject, index) => {
        animeObject[1].index = index
        return animeObject
    })

    // Format the timestamp of when the sorting was completed
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
        const blob = new Blob([data], { type: fileType })

        saveAs(blob, fileName)
    }

    // Handler to update state on checkbox toggle
    const onChangeShowRatings = ({ target: { checked }}) => {
        setShowRatings(checked)
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
                <label className="gallery-checkbox">
                    <input type="checkbox" checked={showRatings} onChange={onChangeShowRatings} /> Show suggested MyAnimeList ratings
                </label>
                {showRatings &&
                    <p className="gallery-warning">
                        <strong>Warning!</strong> This is based on the anime's Elo and is very opinionated and rudimentary. Please do not take these
                        rating suggestions seriously. Works better with more total anime.
                    </p>
                }
            </div>
            {showRatings
                ? <SuggestedRatingsGallery anime={indexedAnime} />
                : <NormalRatingsGallery anime={indexedAnime} />
            }
        </>
    )
}

/**
 * Splits up the gallery into theoretical ratings from 1 to 10 based on Elo.
 */
function SuggestedRatingsGallery({ anime }) {
    const { state: { animeObject } } = useContext(GlobalState)

    // Placeholder for all anime relating to each rating
    const ratings = {
        10: [],
        9: [],
        8: [],
        7: [],
        6: [],
        5: [],
        4: [],
        3: [],
        2: [],
        1: [],
    }

    // Text description of each rating
    const ratingDescriptions = {
        10: 'Masterpiece – 10',
        9:  'Great – 9',
        8:  'Very Good – 8',
        7:  'Good – 7',
        6:  'Fine – 6',
        5:  'Average – 5',
        4:  'Bad – 4',
        3:  'Very Bad – 3',
        2:  'Horrible – 2',
        1:  'Appalling – 1',
    }

    // Lower Elo thresholds for each rating
    const ratingThresholds = {
        10: 2600, // Base
        9:  2400, // -200
        8:  2150, // -250
        7:  1850, // -300
        6:  1500, // -350
        5:  1100, // -400
        4:   750, // -350
        3:   450, // -300
        2:   200, // -250
        1:     0, // -200
    }

    // Sort anime into each rating based on Elo
    for (const [ rating, lower ] of Object.entries(ratingThresholds)) {
        // Work with a real number please
        const ratingInt = parseInt(rating, 10)

        // Upper Elo is the lower threshold of the next rating up
        const upper = ratingInt === 10 ? 9999 : ratingThresholds[ratingInt + 1]

        // Get all anime that match this rating's Elo range
        const matchingAnime = anime.filter(([ , { elo } ]) => elo >= lower && elo < upper).map(animeObject => {
            animeObject[1].rating = ratingInt
            return animeObject
        })

        ratings[rating].push(...matchingAnime)
    }

    // Calculate the average rating
    const averageRating = anime.reduce((total, [ , { rating } ]) => (rating + total), 0) / anime.length

    return (
        <>
            <p className="gallery-average">
                <strong>Average rating:</strong> {averageRating.toFixed(2).toLocaleString()}
            </p>
            {Object.entries(ratings)
                .filter(([ , ratingAnime ]) => !!ratingAnime.length)
                .sort(([ ratingA ], [ ratingB ]) => ratingB - ratingA)
                .map(([ rating, ratingAnime ]) =>
                    <div className="gallery-section is-border" key={rating}>
                        <h2>
                            {ratingDescriptions[rating]}
                            <span>({ratingAnime.length} anime, {(ratingAnime.length / anime.length * 100).toFixed(2).toLocaleString()}%)</span>
                        </h2>
                        <div className="gallery">
                            {ratingAnime.sort(eloSort).map(([ id, { title = false, elo, wonAgainst, lostTo } ], index) =>
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
                    </div>
                )}
        </>
    )
}

/**
 * Displays a normal gallery of all the sorted anime.
 */
function NormalRatingsGallery({ anime }) {
    const { state: { animeObject } } = useContext(GlobalState)

    return (
        <div className="gallery">
            {anime.map(([ id, { title = false, elo, wonAgainst, lostTo } ], index) =>
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
