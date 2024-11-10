import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import Constants from "expo-constants";
import * as SecureStorage from "expo-secure-store";
import { GameData, UserData, GameContext as GameContextType } from "../types";

const SERVER_URL = Constants.expoConfig?.extra?.SERVER_URL;

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [gameMode, setGameMode] = useState<'1' | '2'>('1')
  const [isCheatModeEnabled, setIsCheatModeEnabled] = useState<boolean>(true)

  const [gameData, setGameData] = useState<GameData>({
    boardFeed: [],
    selectedCards: [],
    autoFoundSet: [],
  });

  const [userData, setUserData] = useState<UserData>({
    _id: "",
    username: "",
    stats: {
      gamesPlayed: 0,
      setsFound: 0,
      speedrun3min: 0,
      speedrunWholeStack: 0,
    },
  });

  useEffect(() => {
    const helperFunc = async () => {
      if (isLoggedIn && userData.username.length > 1) {
        console.log('user is logged In and a username was found!')
        // Fetch sessionId from secure storage
        const sessionId = await SecureStorage.getItemAsync("sessionId");
        console.log(
          "sessionId found in gameCOntext which will be sent to syncWithServer is",
          sessionId,
        );
  
        const res = await fetch(
          `${SERVER_URL || "http://10.100.102.143:3000/"}sync-with-server`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Source": "expo", // Instead of credentials omit
            },
            body: JSON.stringify({ userData, sessionId }),
          },
        );
  
        if (!res.ok) {
          const errorData = await res.json();
          if (res.status === 401) {
            throw new Error(
              `Error 401 in syncWithServer in store.ts: ${errorData.error || "Unknown error"}`,
            );
          } else if (res.status === 500) {
            throw new Error(
              `Unknown error in syncWithServer in store.ts: ${errorData.error || "Unknown error"}`,
            );
          }
        }
      } else {
        console.log('no active login was found user data is empty, sync with server WILL NOT run')
      }
    };

    helperFunc();
  }, [userData]);

  return (
    <GameContext.Provider
      value={{
        gameData,
        setGameData,
        userData,
        setUserData,
        isLoggedIn,
        setIsLoggedIn,
        gameMode,
        setGameMode, 
        isCheatModeEnabled,
        setIsCheatModeEnabled
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGameContext() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGameContext must be used within a GameProvider");
  }
  return context;
}
