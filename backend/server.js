import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

import express from 'express'
import cors from 'cors'

import { shuffleNDealCards } from './mainLogic.js'


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


// Config Express.js
//////////////////////////////////////////////////////////////////

const app = express()
const port = process.env.PORT

app.use(cors())
app.use(express.json())

app.post('/start-game', async (req, res) => {
  try {
    console.log('hello from start-game')
    const boardFeed = await shuffleNDealCards()

    console.log("Hello from Express! Board Feed is:");
    boardFeed.forEach(card => console.log(card._id));

    res.json({ messege: 'calling start game from main logic file', boardFeed})
  } catch (err) {
    console.log('Error in start-game functioun in expres smain file', err)
    throw err
  }

})

app.listen(port, () => {
  console.log('listening on port ', port)
})