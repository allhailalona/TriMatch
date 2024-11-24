import { Dispatch, SetStateAction } from "react";

export type Card = {
  _id: string;
  image: {
    data: number[];
  };
};

export type GameData = {
  boardFeed: Card[];
  selectedCards: string[];
  autoFoundSet: string[];
};

export type UserData = {
  _id: string;
  username: string;
  stats: {
    gamesPlayed: number;
    setsFound: number;
    speedrun3min: number;
    speedrunWholeStack: number;
  };
};

export type GameContext = {
  gameData: GameData;
  setGameData: Dispatch<SetStateAction<GameData>>;
  userData: UserData;
  setUserData: Dispatch<SetStateAction<UserData>>;
  isLoggedIn: boolean;
  setIsLoggedIn: Dispatch<SetStateAction<boolean>>;
  gameMode: string;
  setGameMode: Dispatch<SetStateAction<string>>;
  isCheatModeEnabled: boolean;
  setIsCheatModeEnabled: Dispatch<SetStateAction<boolean>>;
  isGameActive: boolean;
  setIsGameActive: Dispatch<SetStateAction<boolean>>;
  resetGameState: () => Promise<void>
};
