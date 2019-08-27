// React
import { createContext } from 'react'

// Libraries
import clone from 'clone'

// Helpers
import { compare, getComparisonPairs } from './Elo'

// Global state
const GlobalState = createContext()

// Reducer actions
const ACTIONS = {
    START_LOADING: Symbol(),
    FINISH_LOADING: Symbol(),
    ERROR_LOADING: Symbol(),
    UPDATE_USERNAME: Symbol(),
    GET_PAIR: Symbol(),
    UPDATE_PAIR: Symbol(),
    UNDO_PAIR: Symbol(),
    IMPORT_DONE: Symbol(),
    IMPORT_ERROR: Symbol(),
    SAVE_STATE: Symbol(),
    RESTORE_STATE: Symbol(),
    DELETE_SAVE_STATE: Symbol(),
}

Object.freeze(ACTIONS)

// Initial state of the app
const initialState = {
    username: '',
    isLoading: false,
    isFinishedLoading: false,
    isErrorLoading: false,
    isFinishedComparing: false,
    isImportFinished: false,
    isImportError: false,
    isSaved: false,
    animeObject: {},
    anime: {},
    totalInitialPairs: 0,
    totalRemainingPairs: 0,
    manuallyEliminatedCount: 0,
    autoEliminatedCountA: 0,
    autoEliminatedCountB: 0,
    currentPair: [],
    previousState: false,
    completedTimestamp: false,
}

// Reducer to handle all actions
function reducer(state, action) {
    switch (action.type) {
    /**
     * Set the state to loading to trigger the load of Jikan API.
     */
    case ACTIONS.START_LOADING:
        return {
            ...state,
            isLoading: true,
        }

    /**
     * Loading has finished, process the API data and start comparing or show the gallery if importing.
     */
    case ACTIONS.FINISH_LOADING: {
        let { apiData } = action

        // Filter to only include completed anime
        apiData = apiData.filter(({ watching_status }) => watching_status === 2)

        // Too few anime to compare
        if (apiData.length < 2) {
            return {
                ...state,
                isLoading: false,
                isErrorLoading: true,
            }
        }

        // Make an object of all anime to easily access them by ID
        const animeObject = apiData.reduce((object, anime) => {
            object[anime.mal_id] = anime

            return object
        }, {})

        // If this was loading as part of an import, skip straight to the gallery
        if (state.isImportFinished) {
            return {
                ...state,
                animeObject,
                isLoading: false,
                isFinishedLoading: true,
                isFinishedComparing: true,
            }
        }

        // Create an object for each anime ID which contains its Elo (default starting at 1600),
        // and arrays of other anime it won against and lost to
        const anime = apiData.reduce((object, cartoon) => {
            object[cartoon.mal_id] = {
                elo: 1600,
                wonAgainst: [],
                lostTo: [],
            }

            return object
        }, {})

        // Get the total initial number of pairs, and a new random pair for comparison
        const [ totalInitialPairs, currentPair ] = getComparisonPairs(anime)

        return {
            ...state,
            isLoading: false,
            isFinishedLoading: true,
            animeObject,
            anime,
            totalInitialPairs,
            totalRemainingPairs: totalInitialPairs,
            currentPair,
        }
    }

    /**
     * Any error during loading displays a generic error message.
     */
    case ACTIONS.ERROR_LOADING:
        return {
            ...state,
            isLoading: false,
            isErrorLoading: true,
        }

    /**
     * Update username while typing.
     */
    case ACTIONS.UPDATE_USERNAME:
        return {
            ...state,
            username: action.username,
            isErrorLoading: false,
        }

    /**
     * Update a pair of anime, where one is the winner and the other is the loser.
     * Also, save a copy of some of the previous state data to be able to undo this action.
     * Then, get a random pair of anime for comparison, as well as the number of total pairs remaining to be compared.
     * If there are no more pairs to compare, display the final gallery of sorted anime.
     */
    case ACTIONS.UPDATE_PAIR: {
        // Run the Elo algorithm
        const [ anime, autoEliminatedCountA, autoEliminatedCountB ] = compare(state.anime, action.winnerId, action.loserId)

        // Get the total remaining number of pairs, and a new random pair for comparison
        const [ totalRemainingPairs, currentPair ] = getComparisonPairs(anime)

        // Make a copy of some of the previous state data for undo
        const previousState = {
            anime: clone(state.anime, false),
            totalRemainingPairs: clone(state.totalRemainingPairs, false),
            currentPair: clone(state.currentPair, false),
            manuallyEliminatedCount: clone(state.manuallyEliminatedCount, false),
            autoEliminatedCountA: clone(state.autoEliminatedCountA, false),
            autoEliminatedCountB: clone(state.autoEliminatedCountB, false),
        }

        // Return the next comparison data or trigger to display the results gallery if no more pairs remain
        return {
            ...state,
            anime,
            isSaved: false,
            isFinishedComparing: !totalRemainingPairs,
            totalRemainingPairs,
            currentPair,
            manuallyEliminatedCount: state.manuallyEliminatedCount + 1,
            autoEliminatedCountA: state.autoEliminatedCountA + autoEliminatedCountA,
            autoEliminatedCountB: state.autoEliminatedCountB + autoEliminatedCountB,
            completedTimestamp: !totalRemainingPairs ? Date.now() : false,
            previousState,
        }
    }

    /**
     * Undo a single comparison of the last pair of anime if there is previous state history.
     */
    case ACTIONS.UNDO_PAIR:
        return {
            ...state,
            anime: clone(state.previousState.anime, false),
            isSaved: false,
            totalRemainingPairs: clone(state.previousState.totalRemainingPairs, false),
            currentPair: clone(state.previousState.currentPair, false),
            manuallyEliminatedCount: clone(state.previousState.manuallyEliminatedCount, false),
            autoEliminatedCountA: clone(state.previousState.autoEliminatedCountA, false),
            autoEliminatedCountB: clone(state.previousState.autoEliminatedCountB, false),
            previousState: false,
        }

    /**
     * Reading import file is done, assign the data to the state and start loading the API data.
     */
    case ACTIONS.IMPORT_DONE:
        return {
            ...state,
            username: action.importData.username,
            anime: action.importData.anime,
            isLoading: true,
            isImportFinished: true,
            totalInitialPairs: action.importData.totalInitialPairs,
            manuallyEliminatedCount: action.importData.manuallyEliminatedCount,
            autoEliminatedCountA: action.importData.autoEliminatedCountA,
            autoEliminatedCountB: action.importData.autoEliminatedCountB,
            completedTimestamp: action.importData.completedTimestamp,
        }

    /**
     * Any error during import displays a generic error mesage.
     */
    case ACTIONS.IMPORT_ERROR:
        return {
            ...state,
            isImportError: true,
        }

    /**
     * Save the current state to be able to restore it later.
     */
    case ACTIONS.SAVE_STATE: {
        localStorage.setItem('savedState', JSON.stringify(state))

        return {
            ...state,
            isSaved: true,
        }
    }

    /**
     * Completely restore a previously saved state to continue sorting.
     */
    case ACTIONS.RESTORE_STATE: {
        const savedState = JSON.parse(localStorage.getItem('savedState'))

        return {
            ...savedState,
            isSaved: true,
        }
    }

    /**
     * Delete any previously saved state data.
     */
    case ACTIONS.DELETE_SAVE_STATE: {
        localStorage.clear()

        return state
    }

    /**
     * No action?
     */
    default:
        return state
    }
}

// Exports
export {
    GlobalState,
    ACTIONS,
    initialState,
    reducer,
}
