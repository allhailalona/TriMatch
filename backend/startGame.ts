// This is startGame.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

import { getGameState, setGameState, delGameState } from './server.ts'
import { Theme } from './types';

//Manually import .env to models.js since it's not in current dir
//////////////////////////////////////////////////////////////////

// Get the directory of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Then go up one dir to locate the .env file
const envPath = path.resolve(__dirname, '..', '.env')

// Then specify the path of the dotenv file using config
dotenv.config({path: envPath})

// Fetch, shuffle and deal cards from cardsThemes in MongoDB
//////////////////////////////////////////////////////////////////

// Define Schemas and Models
const ThemeSchema = new mongoose.Schema({
  _id: String, 
  cards: [{
      _id: String, 
      image: Buffer
  }]
})

const ThemeModel = mongoose.model<Theme>(null, ThemeSchema, 'Themes')

async function connect(): Promise<void> {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string)
    console.log('Connected successfully')
  } catch (err) {
    console.error('Connection failed', err)
    throw err
  }
}

// Fetch data - Later on we will need conditional fetching by selected theme
async function fetchThemes() {
  try {
    // Establish and verify connection
    await connect()
    if (mongoose.connection.readyState === 1) {
      console.log('connection active')
    } else {
      console.log('connection NOT active')
    }

    // Fetch data
    const fetchedData = await ThemeModel.find({}); 

    return fetchedData
  } catch (err) {
    console.error('Error fetching themes:', err);
  } finally {
    await mongoose.disconnect()
  }
}

let shuffledStack: Theme['cards'] = [];
let boardFeed: Theme['cards'] = [];

export async function shuffleNDealCards(): Promise<Theme['cards']> {
  try {
    // Fetch cards
    const fetchedData = await fetchThemes()

    // Inspection suggests that redis is NOT cleared after reload, which is why it's cleared now before reuse
    // Those methods (client.del) would NOT yield errors if the keys don't exist
    await delGameState('shuffledStack')
    await delGameState('bin')
    await delGameState('boardFeed')

    // The required theme data will be an object inside an arrary, which is why
    // we need  to  do the following
    const extractedTheme = fetchedData[0]

    // Shuffle cards, begin by cloning recieved data
    shuffledStack = [...extractedTheme.cards] // Create a shallow copy
    
    for (let i = shuffledStack.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledStack[i], shuffledStack[j]] = [shuffledStack[j], shuffledStack[i]];
    }

    // Deal cards
    boardFeed = shuffledStack.splice(0, 12); // boardFeed is still binaries here
    console.log('hello from startGame.js ss length is', shuffledStack.length)
    await setGameState('shuffledStack', shuffledStack) // Update shuffledStack after dealing cards

    return boardFeed

  } catch (err) {
    console.error('error in shuffle n deal cards function', err)
    throw err
  }
  
}