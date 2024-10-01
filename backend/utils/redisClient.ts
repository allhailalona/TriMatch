import { createClient } from 'redis'
import RedisStore from 'connect-redis'
import session from 'express-session'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import type { GameStateKeys, GameStateValues } from './backendTypes.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../..', '.env')
dotenv.config({ path: envPath })

// Config Redis and Connect
const client = createClient()
client.on('error', (err) => console.log('Redis Client Error', err))
await client.connect()


export async function getGameState(key: GameStateKeys): Promise<GameStateValues | null> {
  try {
    const value = await client.get(key)
    return value ? JSON.parse(value) : null
  } catch (err) {
    throw err
  }
}

export async function setGameState(
  key: GameStateKeys,
  value: GameStateValues,
  time?: number
): Promise<void> {
  try {
    if (time) {
      await client.set(key, JSON.stringify(value), { EX: time })
    } else {
      await client.set(key, JSON.stringify(value))
    }
  } catch (err) {
    throw err
  }
}

export async function delGameState(key: GameStateKeys): Promise<void> {
  try {
    await client.del(key)
  } catch (err) {
    throw err
  }
}

export const sessionMiddleware = session({
  store: new RedisStore({ client: client }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false, // Do not create a session if auth failed
  cookie: {
    httpOnly: true,
    secure: false, // Set this to true when in prod mode
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // Store cookies for 24 hours only
  }
})