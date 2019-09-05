// React
import React, { useReducer, useState, useEffect } from 'react'

// Helpers
import { GlobalState, ACTIONS, initialState, reducer } from './State'
import { getAnimeList, validateImportData } from './Fetch'

// Components
import { CompareAnime } from './Comparing'
import { ResultsGallery } from './ResultsGallery'

// Style
import '../scss/App.scss'

/**
 * ZA WARUDO
 */
function App() {
    const [ state, dispatch ] = useReducer(reducer, initialState)
    const [ hasSavedState, setHasSavedState ] = useState(localStorage.getItem('savedState') !== null)

    useEffect(() => {
        // Only fetch data when loading
        if (!state.isLoading) {
            return
        }

        async function fetchData() {
            let apiData

            try {
                apiData = await getAnimeList(state.username)
            } catch (error) {
                dispatch({ type: ACTIONS.ERROR_LOADING })
                return
            }

            dispatch({
                type: ACTIONS.FINISH_LOADING,
                apiData,
            })
        }

        fetchData()
    })

    // Loading API data in progress
    if (state.isLoading) {
        return (
            <div className="container">
                <h1>Loading {state.username}'s anime list, please wait&hellip;</h1>
            </div>
        )
    }

    // Finished comparing, show the gallery of results
    if (state.isFinishedComparing) {
        return (
            <GlobalState.Provider value={{ state, dispatch }}>
                <ResultsGallery />
            </GlobalState.Provider>
        )
    }

    // Currently comparing, show the comparison UI
    if (state.isFinishedLoading) {
        return (
            <GlobalState.Provider value={{ state, dispatch }}>
                <CompareAnime />
            </GlobalState.Provider>
        )
    }

    // Update username on typing
    const onUsernameChange = ({ target: { value: username } }) => {
        dispatch({
            type: ACTIONS.UPDATE_USERNAME,
            username,
        })
    }

    // Get data for this username
    const onSubmitUsername = () => {
        dispatch({ type: ACTIONS.START_LOADING })
    }

    // Import a file
    const onImport = file => {
        if (!file) {
            return
        }

        // Attempt to read the file as JSON
        const fileReader = new FileReader()

        fileReader.onloadend = () => {
            let importData

            try {
                importData = JSON.parse(fileReader.result)
            } catch (error) {
                dispatch({ type: ACTIONS.IMPORT_ERROR })
                return
            }

            // JSON parsed, now make sure the data inside is correct
            if (!validateImportData(importData)) {
                dispatch({ type: ACTIONS.IMPORT_ERROR })
                return
            }

            dispatch({
                type: ACTIONS.IMPORT_DONE,
                importData,
            })
        }

        // Any file reading error
        fileReader.onerror = () => {
            dispatch({ type: ACTIONS.IMPORT_ERROR })
        }

        // Read as text
        fileReader.readAsText(file)
    }

    // Completely restore a previously saved state
    const restoreSave = () => {
        dispatch({ type: ACTIONS.RESTORE_STATE })
    }

    // Delete a previously saved state
    const deleteSave = () => {
        if (window.confirm('Are you sure? This action cannot be reversed.')) {
            setHasSavedState(false)

            dispatch({ type: ACTIONS.DELETE_SAVE_STATE })
        }
    }

    // Initial view to enter MAL username
    return (
        <>
            <div className="container is-column">
                <p>Anime Sort</p>
                <h1>Enter your MyAnimeList username</h1>
                {state.isErrorLoading && <p className="error">Could not load {state.username}'s anime list.</p>}
                {state.isImportError && <p className="error">Could not import the previous sort.</p>}
                <form onSubmit={onSubmitUsername}>
                    <div>
                        <input type="text" onChange={onUsernameChange} value={state.username} autoFocus={true} />
                        <button disabled={!state.username.length} type="submit">Start!</button>
                    </div>
                    <div className="or">or</div>
                    <div className="import-restore">
                        <label htmlFor="import" className="button">Import previous sort</label>
                        <input type="file" id="import" accept="application/json" onChange={({ target: { files: [ file ] } }) => onImport(file)} />
                        {hasSavedState &&
                            <>
                                <button onClick={restoreSave} type="button">Restore saved progress</button>
                                <button onClick={deleteSave} type="button">Delete saved progress</button>
                            </>
                        }
                    </div>
                </form>
            </div>
            <div className="container is-column is-border description">
                <p><strong>How does this work?</strong></p>
                <p>
                    This app uses the <a href="https://en.wikipedia.org/wiki/Elo_rating_system" target="_blank" rel="noopener noreferrer">Elo rating system</a> to sort anime by continuously <a href="https://en.wikipedia.org/wiki/Pairwise_comparison" target="_blank" rel="noopener noreferrer">comparing two anime</a> against each other. Each anime gains and loses rank points based on which anime it won against or lost to.
                </p>
                <p>
                    Due to the exponential nature of this method, to significantly reduce the number of manual comparisons you need to make for very large sets of anime, losers of the loser will automatically lose to the winner, similarly, winners against the winner will automatically win against the loser. This can reduce the number of manual comparisons you need to make by up to 99.5%.
                </p>
                <p className="pre">
                    In other words, if you choose <span>Anime A</span> over <span>Anime B</span>, and choose <span>Anime B</span> over <span>Anime C</span>, then <span>Anime A</span> and all anime that won against it will automatically win against <span>Anime C</span> and and all anime that lost to it, thus eliminating the need for you to make these decisions manually.
                </p>
                <p>
                    During sorting, you will see a significant increase in total progress as you make more and more decisions and each anime builds up a win/loss history, so don't worry if it feels too slow at the start!
                </p>
                <p>
                    View source code on <a href="https://github.com/fncombo/anime-sort" target="_blank" rel="noopener noreferrer">GitHub</a>. API data powered by <a href="https://jikan.moe/" target="_blank" rel="noopener noreferrer">Jikan API</a>, thanks!
                </p>
            </div>
        </>
    )
}

// Exports
export default App
