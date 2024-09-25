import { createClient } from 'redis'
import type { GameStateKeys, GameStateValues } from './backendTypes.ts'

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
