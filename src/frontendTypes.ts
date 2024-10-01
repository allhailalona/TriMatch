// types.ts

export interface Card {
  _id: string
  image: {
    data: string[]
  }
}

export interface FGS {
  boardFeed: Card[]
  selectedCards: string[]
  autoFoundSet: string[]
}

export interface UserData {
  _id: string
  username: string
  stats: {
    gamesPlayed: number
    setsFound: number
    speedrun3min: number
    speedrunWholeStack: number
  }
}

export type UpdateBoardFeed = (data: Card[]) => void
export type UpdateSelectedCards = (data: string[]) => void
export type UpdateAutoFoundSet = (data: string[]) => void
