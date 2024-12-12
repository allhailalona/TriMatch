// src/hooks/useGameLogic.ts
import { ToastAndroid } from 'react-native'
import * as SecureStore from "expo-secure-store"
import Constants from "expo-constants"
import { useGameContext } from './GameContext'
import { Card, GameData, UserData } from "../types"

const SERVER_URL = Constants.expoConfig?.extra?.SERVER_URL

export function useGameLogic() {
  const { 
    gameData, 
    setGameData,
    userData, 
    setUserData,
    gameMode,
    setIsGameActive,
    resetGameState 
  } = useGameContext()

  // Start a new game session
  const handleStartGame = async (): Promise<void> => {
    if (gameMode) {
      resetGameState()
      setIsGameActive(true)
  
      if (userData.username.length >= 1) {
        setUserData((prev: UserData) => ({
          ...prev,
          stats: {
            ...prev.stats,
            gamesPlayed: prev.stats.gamesPlayed + 1,
          },
        }))
      }
  
      let sessionId
      try {
        sessionId = await SecureStore.getItemAsync("sessionId")
      } catch (err) {
        console.error("Error retrieving sessionId:", err)
      }
  
      const url = new URL(`${SERVER_URL || "http://10.100.102.143:3000/"}start-game`)
      if (sessionId) url.searchParams.append("sessionId", sessionId)
      url.searchParams.append("gameMode", gameMode.toString())
  
      try {
        const res = await fetch(url, {
          method: "GET",
          headers: {
            "X-Request-Origin": "/start-game",
            "X-Source": "expo",
          },
        })
  
        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(`Validation failed: ${errorData.error || "Unknown error"}`)
        }
  
        const data = await res.json()
  
        if (data.sessionId) {
          await SecureStore.setItemAsync("sessionId", data.sessionId)
        }
  
        setGameData((prev: GameData) => ({
          ...prev,
          boardFeed: data.boardFeed,
        }))
      } catch (err) {
        console.error("Error in handleStartGame:", err)
      }
    } else {
      console.warn('user didnt pick a game mode')
      ToastAndroid.show('Please pick a game mode! 🎮', ToastAndroid.SHORT)
    }
  }

  // Automatically find a set on the board
  const handleAutoFindSet = async (): Promise<void> => {
    if (gameData.boardFeed.length < 12) {
      console.log("Not enough cards to find a set")
      return
    }

    try {
      const sbf = gameData.boardFeed.map((card: Card) => card._id).join(",")
      const sessionId = await SecureStore.getItemAsync("sessionId")

      const url = new URL(`${SERVER_URL || "http://10.100.102.143:3000/"}auto-find-set`)
      url.searchParams.append("sbf", sbf)
      if (sessionId) url.searchParams.append("sessionId", sessionId)

      const res = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(`Validation failed: ${errorData.error || "Unknown error"}`)
      }

      const data = await res.json()
      
      setGameData(prev => ({
        ...prev,
        autoFoundSet: data,
      }))
    } catch (err) {
      console.error("Error in handleAutoFindSet:", err)
    }
  }

  // Draw an additional card
  const handleDrawACard = async (): Promise<void> => {
    if (gameData.boardFeed.length < 12 || gameData.boardFeed.length >= 15) {
      console.log("Cannot draw a card at this time")
      return
    }

    try {
      const sessionId = await SecureStore.getItemAsync("sessionId")
      const url = new URL(`${SERVER_URL || "http://10.100.102.143:3000/"}draw-a-card`)
      if (sessionId) url.searchParams.append("sessionId", sessionId)

      const res = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(`Validation failed: ${errorData.error || "Unknown error"}`)
      }

      const data = await res.json()
      setGameData(prev => ({
        ...prev,
        boardFeed: data,
      }))
    } catch (err) {
      console.error("Error in handleDrawACard:", err)
    }
  }

  return {
    handleStartGame,
    handleAutoFindSet,
    handleDrawACard,
  }
}