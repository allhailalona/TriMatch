import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'
import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import cookieParser from 'cookie-parser'

import { shuffleNDealCards } from './startGame.ts'
import { validate, autoFindSet, drawACard } from './gameLogic.ts'
import { genNMail, validateOTP } from './login.ts'

import { Card } from './utils/backendTypes.ts'

// Config dotenv
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '..', '.env')
dotenv.config({ path: envPath })

// express-rate-limit config
// There is NO built-in way to reset the limiter, which means that even if a new OTP is generated, the user still has to wait
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // Window of 10 minutes
  max: 50, // Maximum of 30 requests per window (10 minutes)
  message: { error: 'Too many requests, please try again later.' }
})

// Express.js setup
const app = express()
const port = process.env.PORT

app.use(
  cors({
    origin: 'http://localhost:5173', // Frontend URL
    credentials: true // Allow cookies
  })
)
app.use(express.json())
app.use(limiter)
app.use(cookieParser())

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
    const { selectedCards } = req.body as { selectedCards: string[] }

    const isValidSet = await validate(selectedCards)

    const toReturn: { isValidSet: boolean; boardFeed?: Card[] } = { isValidSet }

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
    const { sbf } = req.body as { sbf: string[] }
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

app.post('/log-out', async (req, res) => {
  try {
    // If the user is logged, this here is more a failsafe mechanism, since this button shouldn't appear if he is not logged in
    if (req.cookies.sessionId) {
      console.log('there are cookies')
      await delGameState(req.cookies.sessionId) // Delete sessionId in Redis

      // Then remove cookies from browser
      res.clearCookie('sessionId', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict'
      })

      res.status(200).json({ message: 'Logged out successfully' })
    } else {
      console.log('there are NO active cookies')
      res.status(401).json({ error: 'No active session' })
    }
  } catch (err) {
    console.error('error in logout express', err.message)
    throw err
  }
})

app.listen(port, () => {
  console.log('listening on port', port)
})
