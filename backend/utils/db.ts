import mongoose from 'mongoose'
import { User, Card, Theme } from './backendTypes.ts'

export async function connect(): Promise<void> {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string)
    if (mongoose.connection.readyState === 1) {
      console.log('connection active')
    } else {
      console.log('connection NOT active')
    }
  } catch (err) {
    throw err
  }
}

// User declaration
const UserSchema = new mongoose.Schema({
  _id: String,
  username: String,
  stats: {
    gamesPlayed: Number,
    setsFound: Number,
    speedrun3min: Number,
    speedrunWholeStack: Number
  }
})

const UserModel = mongoose.model<User>('user', UserSchema, 'Users')

// Card declarations
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

const CardModel = mongoose.model<Card>('Card', cardSchema, 'CardProps')

// Theme decalrations
const ThemeSchema = new mongoose.Schema({
  _id: String,
  cards: [
    {
      _id: String,
      image: Buffer
    }
  ]
})

const ThemeModel = mongoose.model<Theme>('Theme', ThemeSchema, 'Themes')

export { UserModel, CardModel, ThemeModel }
