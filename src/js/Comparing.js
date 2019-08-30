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
    const chooseWinner = (winnerId, loserId, state = false) => {
        // If state was provided, only proceed if component is fully finished animating in
        if (state && state !== 'entered') {
            return
        }

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

    // Key event handler to choose left or right anime with arrows
    const keyHandler = ({ key }) => {
        if (key === 'ArrowLeft') {
            chooseWinner(leftId, rightId)
        } else if (key === 'ArrowRight') {
            chooseWinner(rightId, leftId)
        }
    }

    // Unbind event to use arrow keys as soon as component begins to animate out
    const onExit = () => {
        window.removeEventListener('keyup', keyHandler)
    }

    // Bind event to choose an anime using the arrow keys when the component fully entered and finished animating
    const onEntered = () => {
        window.addEventListener('keyup', keyHandler)
    }

    useEffect(() => {
        // Browser confirm prompt before closing tab, don't want to lose progress by accident!
        // Only trigger this if any progress has not been saved yet
        if (!isSaved) {
            window.onbeforeunload = () => true
        }
    }, [ isSaved ])

    // All anime array to calculate length
    const allAnime = Object.entries(anime)

    // Progress percentage
    const progress = ((totalInitialPairs - totalRemainingPairs) / totalInitialPairs) * 100

    // Total number of automatic decisions
    const totalAutomaticDecisions = autoEliminatedCountA + autoEliminatedCountB

    // References to the left and right anime for easier access
    const left = animeObject[leftId]
    const right = animeObject[rightId]

    return (
        <>
            <div className="container is-column">
                <h1>Which anime is better?</h1>
                <p>Choose by clicking on the image or using the left and right arrow keys.</p>
            </div>
            <div className="container is-column">
                <SwitchTransition>
                    <CSSTransition key={`${leftId}+${rightId}`} timeout={300} classNames="comparison-stage" onExit={onExit} onEntered={onEntered} appear={true}>
                        {state => (
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
                                        <div className="comparison-button" onClick={() => chooseWinner(leftId, rightId, state)}>
                                            <img src={left.image_url} height={350} width={250} alt={right.title} />
                                        </div>
                                    </div>
                                    <div className="comparison-col">
                                        <div className="comparison-button" onClick={() => chooseWinner(rightId, leftId, state)}>
                                            <img src={right.image_url} height={350} width={250} alt={right.title} />
                                        </div>
                                    </div>
                                </div>
                                <div className="comparison-row">
                                    <div className="comparison-col is-normal">
                                        <p><strong>Your rating on MyAnimeList:</strong> {left.score}</p>
                                        <p>
                                            <strong>Type:</strong> {left.type}
                                            {left.total_episodes > 1 ? <> &ndash; {left.total_episodes} episodes</> : ''}
                                        </p>
                                        <p>
                                            <a href={left.url} target="_blank" rel="noopener noreferrer">
                                                Open on MyAnimeList
                                            </a>
                                        </p>
                                    </div>
                                    <div className="comparison-col is-normal">
                                        <p><strong>Your rating on MyAnimeList:</strong> {right.score}</p>
                                        <p>
                                            <strong>Type:</strong> {right.type}
                                            {right.total_episodes > 1 ? <> &ndash; {right.total_episodes} episodes</> : ''}
                                        </p>
                                        <p>
                                            <a href={right.url} target="_blank" rel="noopener noreferrer">
                                                Open on MyAnimeList
                                            </a>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
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
                        {!!totalAutomaticDecisions &&
                            <p><strong>Automatic decisions made:</strong> {(totalAutomaticDecisions).toLocaleString()}</p>
                        }
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
