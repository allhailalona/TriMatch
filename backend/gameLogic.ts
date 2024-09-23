// This is gameLogic.js
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

import { getGameState, setGameState } from './server.ts'
import { Card } from './backendTypes.ts'

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
const cardSchema = new mongoose.Schema<Card>(
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
const CardModel = mongoose.model<Card>('Card', cardSchema, 'CardProps')

async function connect(): Promise<void> {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string)
    console.log('Connected successfully')
  } catch (err) {
    throw err(`connection failed ${err.message}`)
  }
}

async function fetchCardProps(selectedCards: string[] | null, sbf: string[] | null): Promise<Card[]> {
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
export async function validate(selectedCards: string[]): Promise<boolean> {
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
export async function autoFindSet(sbf: string[]): Promise<string[] | null> {
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
function isValidSet(card1: Card, card2: Card, card3: Card): boolean {
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
async function userFoundSet(ctr: string[]): Promise<void> {
  try {
    const bin = (await getGameState('bin')) || [] // Get bin from Redis if it's there otherwise provide a clean version
    
    const boardFeed = await getGameState('boardFeed')
    let replaceCount = 12 - (boardFeed.length - 3) // How many cards to replace, this count will help us later on in the iteration
    let drawnCards
    console.log(replaceCount, 'cards should be replaced!')

    // If we are left with 12 cards after throwing ctr to bin, there is no need to draw new cards
    // Although the removing action is smiliar in both conditions, since we use splice to replace, and the removing has to be done in the expression
    // we have to double it!
    console.log('about to modify boardFeed', boardFeed.length)
    if (replaceCount === 0) {
      // Remove from boardFeed and throw to bin WITHOUT replacing
      replaceNRemove()      
    } else {
      // We need to draw cards
      const shuffledStack = await getGameState('shuffledStack') // There are cards to draw, we need the shuffledStack
      console.log('hello from gameLogic.ts, shuffledStack is', shuffledStack)
      drawnCards = shuffledStack.splice(0, replaceCount) // Draw a specific amount of cards from shuffledStack so we have only 12
      console.log('just drew enough cards to reach 12', drawnCards)
      await setGameState('shuffledStack', shuffledStack) // Update redis key to assure future availability
      
      replaceNRemove()
    }

    console.log('after modify boardFeed', boardFeed.length)
    // eslint-disable-next-line no-inner-declarations
    function replaceNRemove() {
      // Remove cards from boardFeed and replace them with the drawnCards
      for (let i = 0; i < 3; i++) {
        let index = boardFeed.findIndex((obj) => obj._id === ctr[i]) // Find the object that has the _id of the current ctr
        if (index > -1) { // If this object was indeed found in boardFeed
          let removedCard
          if (replaceCount > 0) {
            removedCard = boardFeed.splice(index, 1, drawnCards[i])[0] // Remove cards AND replace them
            replaceCount--
          } else {
            removedCard = boardFeed.splice(index, 1)[0] // Remove cards and do NOT replace them
          }
          // In both cases we should push removedCard to bin after modifying boardFeed
          bin.push(removedCard)
        } else {
          console.log('couldnt find the selectedCard! check it out!')
        }
      }
    }

    await setGameState('boardFeed', boardFeed)
    await setGameState('bin', bin)
  } catch (err) {
    console.error((`error in userFoundSet function in gameLogic.js: ${err}`))
    throw err
  }
}

export async function drawACard(): Promise<void> {
  try {
    console.log('hello from drawACard gameLogic.js')
    const boardFeed = await getGameState('boardFeed')
    const shuffledStack = await getGameState('shuffledStack')    
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
