// React
import React, { useReducer, useEffect } from 'react'

// Helpers
import { GlobalState, ACTIONS, initialState, reducer } from './State'
import getAnimeList from './Fetch'

// Components
import { CompareAnime } from './Comparing'
import { ResultsGallery } from './ResultsGallery'

// Style
import '../scss/App.scss'

// Browser confirm prompt before closing tab, don't want to lose progress by accident!
window.onbeforeunload = () => true

/**
 * ZA WARUDO
 */
function App() {
    const [ state, dispatch ] = useReducer(reducer, initialState)

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

    // Currently comparing, show the left/right UI
    if (state.isFinishedLoading) {
        return (
            <GlobalState.Provider value={{ state, dispatch }}>
                <CompareAnime />
            </GlobalState.Provider>
        )
    }

    // Initial view to enter MAL username
    return (
        <>
            <div className="container is-column">
                <p>Anime Sort</p>
                <h1>Enter your MyAnimeList username</h1>
                {state.isErrorLoading && <p className="error">An error occurred while loading {state.username}'s anime list.</p>}
                <form onSubmit={onSubmitUsername}>
                    <input type="text" onChange={onUsernameChange} value={state.username} />
                    <button disabled={!state.username.length} type="submit">Start!</button>
                </form>
            </div>
            <div className="container is-column is-border description">
                <p><strong>How does this work?</strong></p>
                <p>
                    This app uses the <a href="https://en.wikipedia.org/wiki/Elo_rating_system" target="_blank" rel="noopener noreferrer">Elo rating system</a> to
                    sort anime by continuously comparing two anime against each other. Each anime gains and loses ranking points based on which anime it won against or lost to.
                </p>
                <p>
                    Due to the exponential nature of this method, to significantly reduce the number of comparisons you need to manually make for very large sets of anime,
                    losers of the loser automatically lose to the winner, similarly, winners over the winner win over the loser.
                </p>
                <p className="pre">
                    In other words, if you choose <span>Anime A</span> over <span>Anime B</span>, and then choose <span>Anime B</span> over <span>Anime C</span> then <span>Anime A</span> and
                    all anime it lost to will automatically win against <span>Anime C</span>, thus eliminating the need for you to make these decisions manually.
                </p>
                <p>
                    During sorting, you will see a significant increase in total sorting progress as you approach the middle, and it will slow down again towards the very end.
                    This should take about 5 to 15 minutes if you have up to 100 completed anime, 20 to 30 minutes if you have up to 200 anime, and over 30 minutes if you have over 200 anime.
                </p>
                <p>
                    View source code on <a href="https://github.com/fncombo/animesort" target="_blank" rel="noopener noreferrer">GitHub</a>.
                    API data powered by <a href="https://jikan.moe/" target="_blank" rel="noopener noreferrer">Jikan API</a>, thanks!
                </p>
            </div>
        </>
    )
}

// Exports
export default App
