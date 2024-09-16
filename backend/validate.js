import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

//Manually import .env to models.js since it's not in current dir
//////////////////////////////////////////////////////////////////

// Get the directory of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));
console.log('dirname is', __dirname)

// Then go up one dir to locate the .env file
const envPath = path.resolve(__dirname, '..', '.env')
console.log('envPath is', envPath)

// Then specify the path of the dotenv file using config
dotenv.config({path: envPath})

console.log('contents of dotenv are', process.env.MONGODB_URI);

// Fetch cardProps from MongoDB then Validate selectedCards
//////////////////////////////////////////////////////////////////

// Define Schemas and Models
const cardSchema = new mongoose.Schema({
  _id: String,
  number: { type: Number, enum: [1, 2, 3] },
  shading: { type: String, enum: ['full', 'striped', 'empty'] },
  color: { type: String, enum: ['purple', 'green', 'red'] },
  symbol: { type: String, enum: ['diamond', 'squiggle', 'oval'] }
}, {versionKey: false});

// Create the model
// attention!
const CardModel = mongoose.model('Card', cardSchema, 'CardProps');

async function connect() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected successfully')
  } catch (err) {
    console.error('Connection failed', err)
    throw err
  }
}

async function fetchCardProps(selectedCards) {
  try {
    // Establish and verify connection
    await connect()
    if (mongoose.connection.readyState === 1) {
      console.log('connection active')
    } else {
      console.log('connection NOT active')
    }

    // Fetch only the selected cards from the database, this method saves bandwitch, see below for further details
    const fetchedData = await CardModel.find({ _id: { $in: selectedCards } });
    
    return fetchedData

  } catch (err) {
    console.error('error in fetchCardProps in validate.js', err)
    throw err
  } finally {
    await mongoose.disconnect()
  }
}

export async function validate(selectedCards) {
  try {
    // Since the search for matching cards is now performed in the cloud itself, and NOT in the backend after fetching the WHOLE collection.
    // esc stands for expandedSelectedCards, which are the props of the selectedCards, as located by MongoDB's find function.
    const esc = await fetchCardProps(selectedCards)
    console.log('hello from validate function fetchedData is', esc)

    // The below is no longer necessary, for better performance the logic has changed, see above
    /*
    // Match selectedCards to fetchedData and assign res to expandedSelectedCards (abbr below)
    // Data is returned auto when there are no brackes of any kind after the =>
    const esc = selectedCards.map(selectedCard => 
      fetchedData.find(fetchedCard => fetchedCard._id === selectedCard)
    )

    if (esc.some(card => card === undefined) || esc.length !== 3) {
      throw new Error('One or more selected cards not found in the database');
    }
    */


    // Validation logic - the following is a simplified version of the validation for better debugging - attention
    const props = ['number', 'shading', 'color', 'symbol']
    const [card1, card2, card3] = esc
    let isValidSet = true

    for(let prop of props) {
      const allSame = (card1[prop] === card2[prop]) && (card2[prop] === card3[prop])
      const allDiff = (card1[prop] !== card2[prop]) && (card2[prop] !== card3[prop])

      if (!allSame && !allDiff) {
        isValidSet = false
        break
      }
    }

    if (isValidSet) {
      console.log('validation successful')
      return true
    } else {
      console.log('validation failed')
      return false
    }

  } catch (err) {
    console.error('err in validate function in validate.js', err)
    throw err
  }
}
