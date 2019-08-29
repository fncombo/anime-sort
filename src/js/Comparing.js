// React
import React, { useContext, useEffect } from 'react'

// Libraries
import { SwitchTransition, CSSTransition } from 'react-transition-group'

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
            isSaved,
            animeObject,
            anime,
            totalInitialPairs,
            totalRemainingPairs,
            manuallyEliminatedCount,
            autoEliminatedCountA,
            autoEliminatedCountB,
            currentPair: [ leftId, rightId ] = [ false, false ],
            previousState,
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

    // Undo previous selection and return to it, enabling to change the answer
    const undo = () => {
        dispatch({ type: ACTIONS.UNDO_PAIR })
    }

    // Save the current state so it can be restored later
    const save = () => {
        window.onbeforeunload = () => {}

        dispatch({ type: ACTIONS.SAVE_STATE })
    }

    useEffect(() => {
        // Browser confirm prompt before closing tab, don't want to lose progress by accident!
        // Only trigger this if any progress has not been saved yet
        if (!isSaved) {
            window.onbeforeunload = () => true
        }

        const keyHandler = ({ key }) => {
            if (key === 'ArrowLeft') {
                dispatch({
                    type: ACTIONS.UPDATE_PAIR,
                    winnerId: leftId,
                    loserId: rightId,
                })
            } else if (key === 'ArrowRight') {
                dispatch({
                    type: ACTIONS.UPDATE_PAIR,
                    winnerId: rightId,
                    loserId: leftId,
                })
            }
        }

        // Bind event to choose an anime using the arrow keys
        window.addEventListener('keyup', keyHandler)

        // Unbind event on re-render
        return () => {
            window.removeEventListener('keyup', keyHandler)
        }
    }, [ isSaved, dispatch, leftId, rightId ])

    // All anime array to calculate length
    const allAnime = Object.entries(anime)

    // Progress percentage
    const progress = ((totalInitialPairs - totalRemainingPairs) / totalInitialPairs) * 100

    // References to the left and right anime for easier access
    const left = animeObject[leftId]
    const right = animeObject[rightId]

    return (
        <>
            <div className="container is-column">
                <h1>Which anime is better?</h1>
                <p>Choose by clicking on the image or using the left and right arrow keys.</p>
                <SwitchTransition>
                    <CSSTransition key={`${leftId}+${rightId}`} timeout={300} classNames="comparison-stage">
                        <div className="comparison-stage is-border">
                            <div className="comparison-row">
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
                                    <p><strong>Type:</strong> {left.type}{left.total_episodes > 1 ? <> &ndash; {left.total_episodes} episodes</> : ''}</p>
                                    <p>
                                        <a href={left.url} target="_blank" rel="noopener noreferrer">
                                            Open on MyAnimeList
                                        </a>
                                    </p>
                                </div>
                                <div className="comparison-col is-normal">
                                    <p><strong>Your rating on MyAnimeList:</strong> {right.score}</p>
                                    <p><strong>Type:</strong> {right.type}{right.total_episodes > 1 ? <> &ndash; {right.total_episodes} episodes</> : ''}</p>
                                    <p>
                                        <a href={right.url} target="_blank" rel="noopener noreferrer">
                                            Open on MyAnimeList
                                        </a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CSSTransition>
                </SwitchTransition>
            </div>
            <div className="container is-column comparison-data-border">
                {(previousState || !isSaved) &&
                    <div className="comparison-buttons">
                        {previousState && <button onClick={undo}>Undo last comparison</button>}
                        {!isSaved && <button onClick={save}>Save progress</button>}
                    </div>
                }
                <div className="comparison-row">
                    <div className="progress-container">
                        <p><strong>Total completed anime to sort:</strong> {allAnime.length}</p>
                        <p><strong>Sorting progress:</strong> {progress.toFixed(2).toLocaleString()}%</p>
                        <div className="progress">
                            <div className="progress-bar" style={{ width: `${progress}%` }}></div>
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
