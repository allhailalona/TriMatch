import React, { useState } from "react";
import Constants from 'expo-constants'
import * as SecureStore from 'expo-secure-store'
import { View, TouchableOpacity } from "react-native";
import { styled } from "nativewind";
import { FontAwesome, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import LoginModal from './modals/LoginModal'
import StatsModal from './modals/StatsModal'
import { useGameContext } from '../../context/GameContext'
import { Card, GameData, UserData } from '../../types'

const SERVER_URL = Constants.expoConfig?.extra?.SERVER_URL

const StyledView = styled(View);
const StyledTouchableOpacity = styled(TouchableOpacity);

export default function Navbar() {
  const {gameData, setGameData, userData, setUserData, isLoggedIn, setIsLoggedIn} = useGameContext()
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState<boolean>(false)
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState<boolean>(false)

  async function handleStartGame(): Promise<void> {
    console.log('startGame')
    // Increment gamesPlayed by one if the user is logged in
    if (userData.username.length >= 1) {
      setUserData((prevUserData: UserData) => ({
        ...prevUserData,
        stats: {
          ...prevUserData.stats,
          gamesPlayed: prevUserData.stats.gamesPlayed + 1,
        }
      }));
    }

    // Call Express request
    const res = await fetch(`${SERVER_URL || 'http://10.100.102.143:3000/'}start-game`, {method: "GET"});

    if (!res.ok) {
      // Handle the error response
      const errorData = await res.json();
      throw new Error(
        `Validation failed: ${errorData.message || "Unknown error"}`,
      );
    }

    const data = await res.json();

    // Update relevant item in game data state
    setGameData(prevGameData => ({
      ...prevGameData,
      boardFeed: data
    }));
  }

  async function handleAutoFindSet(): Promise<void> {
    if (gameData.boardFeed.length >= 12) {
      // sbf stands for strippedBoardFeed!
      const sbf = gameData.boardFeed.map((card: Card) => card._id);
      console.log("sbf is", sbf);

      // Convert the array to a comma-separated string
      const sbfString = sbf.join(',');

      // Encode the string to be URL-safe
      const encodedSbf = encodeURIComponent(sbfString);
      const url = `${SERVER_URL || 'http://10.100.102.143:3000/'}auto-find-set?sbf=${encodedSbf}`
      
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        // Handle the error response
        const errorData = await res.json();
        throw new Error(
          `Validation failed: ${errorData.message || "Unknown error"}`,
        );
      }

      const data = await res.json();
      console.log('auto found set is', data)

      // Update board
      setGameData((gameData: GameData) => ({
        ...gameData, 
        autoFoundSet: data
      }))

    } else {
      console.log("data is not here please start a game");
    }
  }

  async function handleDrawACard() {
    if (gameData.boardFeed.length >= 12) {
      if (gameData.boardFeed.length < 15) {
        const res = await fetch(`${SERVER_URL || 'http://10.100.102.143:3000/'}draw-a-card`, {method: "GET"});

        if (!res.ok) {
          // Handle the error response
          const errorData = await res.json();
          throw new Error(
            `Validation failed: ${errorData.message || "Unknown error"}`,
          );
        }

        // The entire array is replaced for security reasons
        const data = await res.json();
        console.log('done drawing card')
        // Update boardFeed
        setGameData(prevGameData => ({
          ...prevGameData,
          boardFeed: data
        }));
      } else {
        console.log('there are already 15 cards start working on a set!')
      }
    } else {
      console.log("data is not here please start a game");
    }
  };

  async function logOut(): Promise<void> {
    // Default userData and toggle isLoggedIn
    const defaultUserData = {
      _id: '', 
      username: '', 
      stats: {
        gamesPlayed: 0, 
        setsFound: 0, 
        speedrun3min: 0, 
        speedrunWholeStack: 0
      }
    }
    setUserData(defaultUserData)
    setIsLoggedIn(false)

    try {
      await SecureStore.deleteItemAsync('sessionId')
      console.log('deleted sessionId from secure storage value now is', await SecureStore.getItemAsync('sessionId'))
    } catch (err) {
      console.error('Error clearing secure storage after log out', err)
    }
  }

  return (
    <StyledView className="w-[6%] h-full p-2 bg-purple-500 flex items-center justify-center">
      <StyledView className='w-full h-full bg-yellow-500 p-2 rounded-lg flex flex-col justify-center items-center'>
        <StyledTouchableOpacity className="flex items-center mb-8" onPress={handleStartGame}>
          <FontAwesome name="play" size={30} />
        </StyledTouchableOpacity>
        <StyledTouchableOpacity className="flex items-center mb-8" onPress={handleAutoFindSet}>
          <MaterialCommunityIcons name="eye" size={30} />
        </StyledTouchableOpacity>
        <StyledTouchableOpacity className="flex items-center mb-8" onPress={handleDrawACard}>
          <MaterialCommunityIcons name="cards-outline" size={30} />
        </StyledTouchableOpacity>
        <StyledTouchableOpacity className="flex items-center mb-8" onPress={() => setIsStatsDialogOpen(true)}>
          <Ionicons name="stats-chart" size={30} />
        </StyledTouchableOpacity>
        {/* If loggedIn show logout button and vice versa */}
        {isLoggedIn ? (
          <StyledTouchableOpacity className="flex items-center mb-8" onPress={logOut}>
            <Ionicons name="exit-outline" size={30} color="black" />
          </StyledTouchableOpacity>
        ) : (
          <StyledTouchableOpacity className="flex items-center mb-8" onPress={() => setIsLoginDialogOpen(!isLoginDialogOpen)}>
            <Ionicons name="enter-outline" size={30} color="black" />
          </StyledTouchableOpacity>
        )}

      </StyledView>
      <LoginModal 
        isOpen={isLoginDialogOpen}
        onClose={() => setIsLoginDialogOpen(false)} 
      />
      <StatsModal 
        isOpen={isStatsDialogOpen}
        onClose={() => setIsStatsDialogOpen(false)} 
      />
    </StyledView>
  );
}
