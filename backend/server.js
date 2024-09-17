import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

import express from 'express'
import cors from 'cors'

import { shuffleNDealCards } from './startGame.js'
import { validate, autoFindSet } from './gameLogic.js'

//Manually import .env to models.js since it's not in current dir
//////////////////////////////////////////////////////////////////

// Get the directory of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url))
console.log('dirname is', __dirname)

// Then go up one dir to locate the .env file
const envPath = path.resolve(__dirname, '..', '.env')
console.log('envPath is', envPath)

// Then specify the path of the dotenv file using config
dotenv.config({ path: envPath })

// Config Express.js
//////////////////////////////////////////////////////////////////

const app = express()
const port = process.env.PORT

app.use(cors())
app.use(express.json())

app.post('/start-game', async (req, res) => {
  try {
    const boardFeed = await shuffleNDealCards()

    res.json(boardFeed)
  } catch (err) {
    console.log('Error in start-game functioun in expres smain file', err)
    throw err
  }
})

app.post('/validate', async (req, res) => {
  try {
    console.log('hello from server.js recieved validate call')
    const { selectedCards } = req.body

    res.json(await validate(selectedCards))
    

  } catch (err) {
    throw new Error('error in /validatei in express.js', err)
  }
})

app.post('/find-set', async (req, res) => {
  try {
    const { sbf } = req.body

    const autoFoundSet = await autoFindSet(sbf)
    console.log('express autoFoundSet is', autoFoundSet)
    res.json(autoFoundSet)
  } catch (err) {
    throw new Error (`error in /find-set in server file: ${err.message}`)
  }

})

app.listen(port, () => {
  console.log('listening on port ', port)
})
