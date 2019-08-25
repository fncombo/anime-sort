// React
import React, { useContext } from 'react'

// Helpers
import { GlobalState } from './State'

// Style
import '../scss/ResultsGallery.scss'

/**
 * Show a gallery of all the anime sorted by Elo.
 */
function ResultsGallery() {
    const { state: {
        animeObject,
        anime,
        totalInitialPairs,
        manuallyEliminatedCount,
        autoEliminatedCountA,
        autoEliminatedCountB,
    } } = useContext(GlobalState)

    const allAnime = Object.entries(anime)

    return (
        <>
            <div className="container is-column">
                <h1>Here is your sorted anime, enjoy!</h1>
                <p><strong>Comparison decisions you've made:</strong> {manuallyEliminatedCount.toLocaleString()}</p>
                <p><strong>Automatic decisions made:</strong> {(autoEliminatedCountA + autoEliminatedCountB).toLocaleString()}</p>
                <p><strong>Total pairs of anime compared:</strong> {totalInitialPairs.toLocaleString()}</p>
            </div>
            <div className="gallery">
                {allAnime.sort(([ , { elo: aElo} ], [ , { elo: bElo } ]) => {
                    return bElo - aElo
                }).map(([ id, { elo, wonAgainst, lostTo } ], index) =>
                    <GalleryItem
                        anime={animeObject[id]}
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
function GalleryItem({ anime, index, elo, wonAgainst, lostTo }) {
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
