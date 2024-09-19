import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

import { getGameState, setGameState } from './server.js'

//Manually import .env to models.js since it's not in current dir
//////////////////////////////////////////////////////////////////

// Get the directory of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Then go up one dir to locate the .env file
const envPath = path.resolve(__dirname, '..', '.env')

// Then specify the path of the dotenv file using config
dotenv.config({ path: envPath })

// Fetch cardProps from MongoDB then Validate selectedCards
//////////////////////////////////////////////////////////////////

// Define Schemas and Models
const cardSchema = new mongoose.Schema(
  {
    _id: String,
    number: { type: Number, enum: [1, 2, 3] },
    shading: { type: String, enum: ['full', 'striped', 'empty'] },
    color: { type: String, enum: ['purple', 'green', 'red'] },
    symbol: { type: String, enum: ['diamond', 'squiggle', 'oval'] }
  },
  { versionKey: false }
)

// Create the model
// attention!
const CardModel = mongoose.model('Card', cardSchema, 'CardProps')

async function connect() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected successfully')
  } catch (err) {
    throw err(`connection failed ${err.message}`)
  }
}

async function fetchCardProps(selectedCards, sbf) {
  try {
    // Establish and verify connection
    await connect()
    if (mongoose.connection.readyState === 1) {
      console.log('connection active')
    } else {
      console.log('connection NOT active')
    }

    // Fetch only the selected cards from the database, this method saves bandwitch, see below for further details
    let fetchedData
    if (selectedCards && !sbf) {
      fetchedData = await CardModel.find({ _id: { $in: selectedCards } })
    } else if (!selectedCards && sbf) {
      fetchedData = await CardModel.find({ _id: { $in: sbf } })
    } else {
      console.log('something is wrong with fetchCardsProp check it out')
    }

    return fetchedData
  } catch (err) {
    console.error('error in fetchCardProps in validate.js', err)
    throw err
  } finally {
    await mongoose.disconnect()
  }
}

// attention, perhaps renaming is in order
export async function validate(selectedCards) {
  try {
    // esc stands for expandedSelectedCards, which are the props of the selectedCards, as located by MongoDB's find function.
    const esc = await fetchCardProps(selectedCards, null)

    const [card1, card2, card3] = esc
    if (isValidSet(card1, card2, card3)) {
      await userFoundSet(selectedCards)
      return true
    } else {
      return false
    }
  } catch (err) {
    throw err(`err in validate function: ${err.message}`)
  }
}

// Misc functions regarding the game logic, for now it's the autoFindSet function
export async function autoFindSet(sbf) {
  try {
    // ebf stands for expandedBoardFeed, contains the MongoDB props that match sbf
    const ebf = await fetchCardProps(null, sbf)

    // Iterate over all possible combinations of 3 cards
    for (let i = 0; i < ebf.length - 2; i++) {
      for (let j = i + 1; j < ebf.length - 1; j++) {
        for (let k = j + 1; k < ebf.length; k++) {
          if (isValidSet(ebf[i], ebf[j], ebf[k])) {
            // Return the IDs of the cards forming a valid set
            return [ebf[i]._id, ebf[j]._id, ebf[k]._id]
          }
        }
      }
    }

    // If no set is found, return null or an appropriate message
    return null
  } catch (err) {
    throw err(`err in autoFindSet function: ${err.message}`)
  }
}

// Validation logic - the following is a simplified version of the validation for better debugging
function isValidSet(card1, card2, card3) {
  const props = ['number', 'shading', 'color', 'symbol']

  let isValidSet = true

  for (let prop of props) {
    const allSame = card1[prop] === card2[prop] && card2[prop] === card3[prop]
    const allDiff =
      card1[prop] !== card2[prop] && card2[prop] !== card3[prop] && card1[prop] !== card3[prop]

    if (!allSame && !allDiff) {
      isValidSet = false
      break
    }
  }

  return isValidSet
}

// ctr stands for cardsToRemove
async function userFoundSet(ctr) {
  try {
    const boardFeed = await getGameState('boardFeed')
    let bin = (await getGameState('bin')) || [] // Get bin from Redis if it's there otherwise provide a clean version

    const shuffledStack = await getGameState('shuffledStack')
    const drawnCards = shuffledStack.splice(0, 3) // Get the first three cards of shuffledStack
    await setGameState('shuffledStack', shuffledStack) // Update redis key to the new shortened version

    // sctr stands for stripped sctr, leaving only the _id
    //const sctr

    // Remove from boardFeed and add to bin
    for (let i = 0; i < 3; i++) {
      // boardFeed is an object!!! not an array!
      let index = boardFeed.findIndex((obj) => obj._id === ctr[i]) // Declared beforehand to enable validation
      if (index > -1) {
        const removedCard = boardFeed.splice(index, 1, drawnCards[i])[0] // Remove cards from boardFeed and insert new card
        bin.push(removedCard) // Push the used cards to the bin
      }
    }

    await setGameState('boardFeed', boardFeed)
    await setGameState('bin', bin)
  } catch (err) {
    throw err(`error in userFoundSet function in gameLogic.js: ${err.message}`)
  }
}

export async function drawACard() {
  try {
    console.log('hello from drawACard')
    const shuffledStack = await getGameState('shuffledStack')
    const boardFeed = await getGameState('boardFeed')
    
    const drawnCard = shuffledStack.splice(0,1) // Draw a new card
    await setGameState('shuffledStack', shuffledStack) // Update Redis shuffledStack to avoid drawing identical cards
    console.log('drawnCard is', drawnCard)

    boardFeed.push(drawnCard[0])
    console.log('boardFeed is', boardFeed)
    await setGameState('boardFeed', boardFeed) // Update Redis boardFeed
  } catch (err) {
    console.error('error in drawACard function in gameLogic.js')
    throw err
  }
}
