// This is server.ts
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'
import express from 'express'
import cors from 'cors'

import { createClient } from 'redis'
import { shuffleNDealCards } from './startGame.js'
import { validate, autoFindSet, drawACard } from './gameLogic.js'
import { Card, GameStateKey } from './types';

// Config dotenv
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '..', '.env')
dotenv.config({ path: envPath })

// Config Redis and Connect
const client = createClient()
client.on('error', (err) => console.log('Redis Client Error', err))
await client.connect()

export async function getGameState(key: GameStateKey): Promise<any> {
  try {
    const value = await client.get(key)
    return value ? JSON.parse(value) : null
  } catch (err) {
    console.error(`Error retrieving game state: ${err.message}`)
    throw err(`Failed to get game state: ${err.message}`)
  }
}

export async function setGameState(key: GameStateKey, value: any): Promise<void> {
  try {
    await client.set(key, JSON.stringify(value))
  } catch (err) {
    console.error(`Error setting game state: ${err.message}`)
    throw err(`Failed to set game state: ${err.message}`)
  }
}

export async function delGameState(key: GameStateKey): Promise<void> {
  try {
    await client.del(key)
  } catch (err) {
    console.error(`Error deleting game state: ${err.message}`)
    throw err(`Failed to delete game state: ${err.message}`)
  }
}

// Express.js setup
const app = express()
const port = process.env.PORT

app.use(cors())
app.use(express.json())

app.post('/start-game', async (req, res) => {
  try {
    const boardFeed = await shuffleNDealCards() // boardFeed is still binaries here
    await setGameState('boardFeed', boardFeed) // It's here the binaries are converted to buffers!
    res.json(boardFeed)
  } catch (err) {
    console.error('Error in start-game function:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/validate', async (req, res) => {
  try {
    const { selectedCards } = req.body as { selectedCards: string[] };

    const isValidSet = await validate(selectedCards)

    const toReturn: { isValidSet: boolean; boardFeed?: Card[] } = { isValidSet };

    // Return boardFeed as well if the set is valid (the boardFeed is updated)
    if (isValidSet) {
      const boardFeed = await getGameState('boardFeed')
      console.log('after update express', boardFeed)
      toReturn.boardFeed = boardFeed
    }

    res.json(toReturn)
  } catch (err) {
    console.error('Error in /validate:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/auto-find-set', async (req, res) => {
  try {
    const { sbf } = req.body as { sbf: string[] };
    const autoFoundSet = await autoFindSet(sbf)
    res.json(autoFoundSet)
  } catch (err) {
    console.error('Error in /find-set:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/draw-a-card', async (req, res) => {
  try {
    console.log('hello from draw-a-card exprress')
    await drawACard()
    const boardFeed = await getGameState('boardFeed')
    res.json(boardFeed)
  } catch (err) {
    console.error('Error in /draw-a-card:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.listen(port, () => {
  console.log('listening on port', port)
})
