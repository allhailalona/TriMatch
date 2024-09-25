import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

//Manually import .env to models.js since it's not in current dir
//////////////////////////////////////////////////////////////////

// Get the directory of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url))
console.log('dirname is', __dirname)

// Then go up one dir to locate the .env file
const envPath = path.resolve(__dirname, '..', '.env')

// Then specify the path of the dotenv file using config
dotenv.config({ path: envPath })

// Config then Insert data
//////////////////////////////////////////////////////////////////

// Define the card schema
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
const Card = mongoose.model('Card', cardSchema, 'CardProps')

// Function to generate all possible combinations
function generateCards() {
  const numbers = [1, 2, 3]
  const shadings = ['full', 'striped', 'empty']
  const colors = ['purple', 'green', 'red']
  const symbols = ['diamond', 'squiggle', 'oval']

  const cards = []

  for (let number of numbers) {
    for (let shading of shadings) {
      for (let color of colors) {
        for (let symbol of symbols) {
          const id = `${number}${shading[0]}${color[0]}${symbol[0]}`
          cards.push({
            _id: id,
            number,
            shading,
            color,
            symbol
          })
        }
      }
    }
  }

  return cards
}

//Setup mongoose connection with mongoDB
//////////////////////////////////////////////////////////////////

// Ensure MONGODB_URI is defined
const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in the environment variables')
  process.exit(1)
}

// Connect to mongoDB and save cards
async function saveCards(cards) {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('connected to MongoDB')

    // Clear existing cards
    await Card.deleteMany({})
    console.log('Cleared existing cards')

    // Add generated cards
    await Card.insertMany(cards)
    console.log('inserted', cards.length, 'cards')
  } catch (err) {
    throw err
  } finally {
    await mongoose.disconnect()
    console.log('disconnected from MongoDB')
  }
}

const cards = generateCards()
saveCards(cards)
