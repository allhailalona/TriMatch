import React from "react";
import { View, TouchableOpacity } from "react-native";
import { styled } from "nativewind";
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useGameContext } from '../../context/GameContext'
import { Card, GameData, UserData } from '../../types'

const StyledView = styled(View);
const StyledTouchableOpacity = styled(TouchableOpacity);

export default function Navbar() {
  const {gameData, setGameData, userData, setUserData} = useGameContext()

  async function handleStartGame(): Promise<void> {
    console.log('startGame')
    // Increment gamesPlayed by one if the user is logged in
    if (userData.username.length >= 1) {
      setUserData(prevUserData => ({
        ...prevUserData,
        stats: {
          ...prevUserData.stats,
          gamesPlayed: prevUserData.stats.gamesPlayed + 1,
        }
      }));
    }

    // Call Express request
    const res = await fetch("https://set-the-game.onrender.com/start-game", {method: "GET"});

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

    // Increment gamesPlayed in userData
    setUserData((userData: UserData) => ({
      ...userData, 
      stats: {
        ...userData.stats, 
        gamesPlayed: userData.stats.gamesPlayed + 1
      }
    }))
  }

  async function handleAutoFindSet(): Promise<void> {
      if (gameData.boardFeed.length >= 12) {
        /*
            Convert boardFeed, which now contains image data as well, to an id only array, which looks
            like the selectedCards array, then MongoDB can find the relevant items in cardProps. This process is done in 
            the front to save bandwitch. sbf stands for strippedBoardFeed
          */
  
        // sbf stands for strippedBoardFeed!
        const sbf = gameData.boardFeed.map((card: Card) => card._id);
        console.log("sbf is", sbf);

        // Convert the array to a comma-separated string
        const sbfString = sbf.join(',');

        // Encode the string to be URL-safe
        const encodedSbf = encodeURIComponent(sbfString);
        console.log('encoded Sbf is', encodedSbf)
  
        console.log("data is here calling express");
        const res = await fetch(`https://set-the-game.onrender.com/auto-find-set?sbf=${encodedSbf}`, {
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
        const res = await fetch("https://set-the-game.onrender.com/draw-a-card", {method: "GET"});

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
      </StyledView>
    </StyledView>
  );
}
