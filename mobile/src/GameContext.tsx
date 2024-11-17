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
  const [gameMode, setGameMode] = useState<string>("");
  const [isCheatModeEnabled, setIsCheatModeEnabled] = useState<boolean>(true);
  const [isGameActive, setIsGameActive] = useState<boolean>(false)
  const [totalSetsFound, setTotalSetsFound] = useState<number>(0)

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
        console.log("user is logged In and a username was found!");
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
        console.log(
          "no active login was found user data is empty, sync with server WILL NOT run",
        );
      }
    };

    helperFunc();
  }, [userData]);

  async function resetGameState() {
    // Clear gameData here as well for cases when the user starts a new game while there is an active one
    setGameData({
      selectedCards: [], 
      autoFoundSet: [], 
      boardFeed: []
    })

    setIsGameActive(false)
    setTotalSetsFound(0) // A temporary insecure practice! what can I do... time constraints...

    // The Redis states are supposed to be cleared on shuffleNDealCards (assuming the sessionId is identical, otherwise, they'll simply expire)
    // Make sure there are NO 3min speedrun timers running in bg
    console.log('clearing existing timers!')
    const clearTimerRes = await fetch(`${SERVER_URL || "http://10.100.102.143:3000/"}clear-timer`, {method: 'POST'})
    
    if (!clearTimerRes.ok) {
      // Handle the error response
      const errorData = await clearTimerRes.json();
      throw new Error(
        `Clearing timer failed: ${errorData.error || "Unknown error"}`,
      );
    }
  }

  return (
    <GameContext.Provider
      value={{
        gameData, setGameData,
        userData, setUserData,
        isLoggedIn, setIsLoggedIn,
        gameMode, setGameMode,
        isCheatModeEnabled, setIsCheatModeEnabled, 
        isGameActive, setIsGameActive,
        totalSetsFound, setTotalSetsFound,
        resetGameState
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
