import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { GameData, UserData, GameContext as GameContextType } from '../types';

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameData, setGameData] = useState<GameData>({
    boardFeed: [],
    selectedCards: [],
    autoFoundSet: [],
  });

  const [userData, setUserData] = useState<UserData>({
    _id: '',
    username: '',
    stats: {
      gamesPlayed: 0,
      setsFound: 0,
      speedrun3min: 0,
      speedrunWholeStack: 0,
    },
  });

  useEffect(() => {
    console.log('game data has changed')
  }, [gameData])

  return (
    <GameContext.Provider value={{ gameData, setGameData, userData, setUserData }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGameContext() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
}
