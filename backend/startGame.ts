import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

import { setGameState, delGameState } from './utils/redisClient.ts'
import { connect, ThemeModel } from './utils/db.ts'
import { Theme } from './utils/backendTypes.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '..', '.env')
dotenv.config({ path: envPath })

// Fetch data - Later on we will need conditional fetching by selected theme
async function fetchThemes() {
  try {
    // Establish and verify connection
    await connect()

    // Fetch data
    const fetchedData = await ThemeModel.find({})

    return fetchedData
  } catch (err) {
    throw err
  } finally {
    await mongoose.disconnect()
  }
}

let shuffledStack: Theme['cards'] = []
let boardFeed: Theme['cards'] = []

export async function shuffleNDealCards(): Promise<Theme['cards']> {
  try {
    // Fetch cards
    console.log('trying to fetch cards')
    const fetchedData = await fetchThemes()
    console.log('successfuly fetched cards')

    // Inspection suggests that redis is NOT cleared after reload, which is why it's cleared now before reuse
    // Those methods (client.del) would NOT yield errors if the keys don't exist
    await delGameState('shuffledStack')
    await delGameState('bin')
    await delGameState('boardFeed')

    // The required theme data will be an object inside an arrary, which is why
    // we need  to  do the following
    const extractedTheme = fetchedData![0]

    // Shuffle cards, begin by cloning recieved data
    shuffledStack = [...extractedTheme.cards] // Create a shallow copy

    for (let i = shuffledStack.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffledStack[i], shuffledStack[j]] = [shuffledStack[j], shuffledStack[i]]
    }

    // Deal cards
    boardFeed = shuffledStack.splice(0, 12) // boardFeed is still binaries here
    console.log('hello from startGame.js ss length is', shuffledStack.length)
    await setGameState('shuffledStack', shuffledStack) // Update shuffledStack after dealing cards

    return boardFeed
  } catch (err) {
    throw err
  }
}
