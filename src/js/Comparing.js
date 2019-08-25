// React
import React, { useContext, useEffect } from 'react'

// Helpers
import { GlobalState, ACTIONS } from './State'

// Style
import '../scss/Comparing.scss'

/**
 * UI to compare two anime against each other.
 */
function CompareAnime() {
    const {
        state: {
            isComparing,
            animeObject,
            anime,
            totalInitialPairs,
            totalRemainingPairs,
            manuallyEliminatedCount,
            autoEliminatedCountA,
            autoEliminatedCountB,
            currentPair: [
                leftId,
                rightId,
            ] = [ false, false ],
        },
        dispatch,
    } = useContext(GlobalState)

    // Callback to choose which anime wins
    const chooseWinner = (winnerId, loserId) => {
        dispatch({
            type: ACTIONS.UPDATE_PAIR,
            winnerId,
            loserId,
        })
    }

    useEffect(() => {
        const keyHandler = ({ key }) => {
            if (key === 'ArrowLeft') {
                dispatch({
                    type: ACTIONS.UPDATE_PAIR,
                    winnerId: leftId,
                    loserId: rightId,
                })

                return
            }

            if (key === 'ArrowRight') {
                dispatch({
                    type: ACTIONS.UPDATE_PAIR,
                    winnerId: rightId,
                    loserId: leftId,
                })
            }
        }

        if (isComparing) {
            // Bind event to choose an anime using the arrow keys
            window.addEventListener('keyup', keyHandler, { once: true })

            // Unbind event on re-render
            return () => {
                window.removeEventListener('keyup', keyHandler)
            }
        }

        // Get a new pair of anime to compare
        dispatch({ type: ACTIONS.GET_PAIR })
    })

    // Wait until next comparison
    if (!isComparing) {
        return null
    }

    const allAnime = Object.entries(anime)
    const progress = ((totalInitialPairs - totalRemainingPairs) / totalInitialPairs) * 100
    const left = animeObject[leftId]
    const right = animeObject[rightId]

    return (
        <>
            <div className="container is-column">
                <h1>Which anime is better?</h1>
                <p>Choose by clicking on the image or using the left and right arrow keys.</p>
                <div className="comparison-row is-border">
                    <div className="comparison-col">
                        <h2>{left.title}</h2>
                    </div>
                    <div className="comparison-col">
                        <h2>{right.title}</h2>
                    </div>
                </div>
                <div className="comparison-row">
                    <div className="comparison-col">
                        <div className="comparison-button" onClick={() => chooseWinner(leftId, rightId)}>
                            <img src={left.image_url} height={350} width={250} alt={right.title} />
                        </div>
                    </div>
                    <div className="comparison-col">
                        <div className="comparison-button" onClick={() => chooseWinner(rightId, leftId)}>
                            <img src={right.image_url} height={350} width={250} alt={right.title} />
                        </div>
                    </div>
                </div>
                <div className="comparison-row">
                    <div className="comparison-col is-normal">
                        <p><strong>Your rating on MyAnimeList:</strong> {left.score}</p>
                        <p>
                            <a href={left.url} target="_blank" rel="noopener noreferrer">
                                Open on MyAnimeList
                            </a>
                        </p>
                    </div>
                    <div className="comparison-col is-normal">
                        <p><strong>Your rating on MyAnimeList:</strong> {right.score}</p>
                        <p>
                            <a href={right.url} target="_blank" rel="noopener noreferrer">
                                Open on MyAnimeList
                            </a>
                        </p>
                    </div>
                </div>
            </div>
            <div className="container">
                <div className="comparison-row is-border">
                    <div className="progress-container">
                        <p><strong>Total completed anime to sort:</strong> {allAnime.length}</p>
                        <p><strong>Sorting progress:</strong> {progress.toFixed(2)}%</p>
                        <div className="progress">
                            <div className="progress-bar" style={{ width: `${progress.toLocaleString()}%` }}></div>
                        </div>
                        <p><strong>Comparison decisions you've made:</strong> {manuallyEliminatedCount.toLocaleString()}</p>
                        <p><strong>Automatic decisions made:</strong> {(autoEliminatedCountA + autoEliminatedCountB).toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </>
    )
}

// Exports
export {
    CompareAnime,
}
