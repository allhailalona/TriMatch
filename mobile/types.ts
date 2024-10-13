import { Dispatch, SetStateAction } from 'react'

export type Card = {
  _id: string;
  image: {
    data: string[];
  };
}

export type GameData = {
  boardFeed: Card[];
  selectedCards: string[];
  autoFoundSet: string[];
}

export type UserData = {
  _id: string;
  username: string;
  stats: {
    gamesPlayed: number;
    setsFound: number;
    speedrun3min: number;
    speedrunWholeStack: number;
  };
}

export type GameContext = {
  gameData: GameData
  setGameData: Dispatch<SetStateAction<GameData>>
  userData: UserData;
  setUserData: Dispatch<SetStateAction<UserData>>;
}