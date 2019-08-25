// React
import { createContext } from 'react'

// Libraries
import shuffleArray from 'shuffle-array'

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
    IMPORT_DONE: Symbol(),
    IMPORT_ERROR: Symbol(),
}

Object.freeze(ACTIONS)

// Initial state of the app
const initialState = {
    username: '',
    isLoading: false,
    isFinishedLoading: false,
    isErrorLoading: false,
    isComparing: false,
    isFinishedComparing: false,
    isImportFinished: false,
    isImportError: false,
    animeObject: [],
    anime: {},
    totalInitialPairs: 0,
    totalRemainingPairs: 0,
    manuallyEliminatedCount: 0,
    autoEliminatedCountA: 0,
    autoEliminatedCountB: 0,
    currentPair: [],
}

// Reducer to handle all actions
function reducer(state, action) {
    switch (action.type) {
    case ACTIONS.START_LOADING:
        return {
            ...state,
            isLoading: true,
        }

    case ACTIONS.FINISH_LOADING: {
        let { apiData } = action

        // Filter to only include completed anime
        apiData = shuffleArray(apiData.filter(({ watching_status }) => watching_status === 2))

        // Too few anime to compare
        if (apiData.length < 2) {
            return {
                ...state,
                isLoading: false,
                isErrorLoading: true,
            }
        }

        // Make an object of all anime to easily access them by ID
        const animeObject = apiData.reduce((object, cartoon) => {
            object[cartoon.mal_id] = cartoon

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
            isComparing: true,
            animeObject,
            anime,
            totalInitialPairs,
            totalRemainingPairs: totalInitialPairs,
            currentPair,
        }
    }

    case ACTIONS.ERROR_LOADING:
        return {
            ...state,
            isLoading: false,
            isErrorLoading: true,
        }

    case ACTIONS.UPDATE_USERNAME:
        return {
            ...state,
            username: action.username,
            isErrorLoading: false,
        }

    case ACTIONS.GET_PAIR: {
        // Get the total remaining number of pairs, and a new random pair for comparison
        const [ totalRemainingPairs, currentPair ] = getComparisonPairs(state.anime)

        if (!totalRemainingPairs) {
            return {
                ...state,
                isFinishedComparing: true,
                totalRemainingPairs,
                currentPair,
            }
        }

        // Set that comparison is in progress to display the relevant UI
        return {
            ...state,
            isComparing: true,
            totalRemainingPairs,
            currentPair,
        }
    }

    case ACTIONS.UPDATE_PAIR: {
        const [ anime, autoEliminatedCountA, autoEliminatedCountB ] = compare(state.anime, action.winnerId, action.loserId)

        // Set that nothing is being compared to trigger getting the next comparison
        return {
            ...state,
            anime,
            isComparing: false,
            manuallyEliminatedCount: state.manuallyEliminatedCount + 1,
            autoEliminatedCountA: state.autoEliminatedCountA + autoEliminatedCountA,
            autoEliminatedCountB: state.autoEliminatedCountB + autoEliminatedCountB,
        }
    }

    case ACTIONS.IMPORT_DONE: {
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
        }
    }

    case ACTIONS.IMPORT_ERROR:
        return {
            ...state,
            isImportError: true,
        }

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
