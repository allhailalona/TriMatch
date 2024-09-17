import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'
import express from 'express'
import cors from 'cors'
import { createClient } from 'redis';
import { shuffleNDealCards } from './startGame.js'
import { validate, autoFindSet } from './gameLogic.js'

// Config dotenv
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '..', '.env')
dotenv.config({ path: envPath })

// Config Redis and Connect
const client = createClient()
client.on('error', err => console.log('Redis Client Error', err));
await client.connect();

export async function getGameState(key) {
  try {
    const value = await client.get(key)
    return value ? JSON.parse(value) : null
  } catch (err) {
    console.error(`Error in getGameState: ${err.message}`)
    return null
  }
}

async function setGameState(key, value) {
  try {
    await client.set(key, JSON.stringify(value))
  } catch (err) {
    console.error(`Error in setGameState: ${err.message}`)
  }
}

// Express.js setup
const app = express()
const port = process.env.PORT

app.use(cors())
app.use(express.json())

app.post('/start-game', async (req, res) => {
  try {
    const boardFeed = await shuffleNDealCards()
    await setGameState('boardFeed', boardFeed)
    res.json(boardFeed)
  } catch (err) {
    console.error('Error in start-game function:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/validate', async (req, res) => {
  try {
    const { selectedCards } = req.body
    const result = await validate(selectedCards)
    res.json(result)
  } catch (err) {
    console.error('Error in /validate:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/find-set', async (req, res) => {
  try {
    const { sbf } = req.body
    const autoFoundSet = await autoFindSet(sbf)
    res.json(autoFoundSet)
  } catch (err) {
    console.error('Error in /find-set:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.listen(port, () => {
  console.log('listening on port', port)
})