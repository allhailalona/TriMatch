import React, { useState } from "react";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { View, TouchableOpacity, Text } from "react-native";
import { styled } from "nativewind";
import {
  FontAwesome,
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";
import LoginModal from "./modals/LoginModal";
import StatsModal from "./modals/StatsModal";
import SettingsModal from './modals/SettingsModal'
import { useGameContext } from "../../context/GameContext";
import { Card, GameData, UserData } from "../../types";

const SERVER_URL = Constants.expoConfig?.extra?.SERVER_URL;

const StyledView = styled(View);
const StyledTouchableOpacity = styled(TouchableOpacity);

export default function Navbar() {
  const {
    gameData,
    setGameData,
    userData,
    setUserData,
    isLoggedIn,
    setIsLoggedIn,
    isCheatModeEnabled
  } = useGameContext();
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState<boolean>(false);
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState<boolean>(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState<boolean>(false)

  async function clearSecureStorage(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('sessionId')
    } catch (err) {
      console.error('err  in clearSecureStorage in Navbar.tsx mobile', err)
    }
  }

  async function handleStartGame(): Promise<void> {
    // Increment gamesPlayed by one if the user is logged in
    if (userData.username.length >= 1) {
      setUserData((prevUserData: UserData) => ({
        ...prevUserData,
        stats: {
          ...prevUserData.stats,
          gamesPlayed: prevUserData.stats.gamesPlayed + 1,
        },
      }));
    }

    // Try to fetch sessionId so middleware knows to create or not a guest sessions
    let sessionId
    try {
      sessionId = await SecureStore.getItemAsync("sessionId");
    } catch (err) {
      console.error('error retrieving iduser/guest sessionsId from secure store in navbar.tsx mobile', err)
    }

    // Build the URL with sessionId as a query parameter if it exists
    const url = new URL(`${SERVER_URL || "http://10.100.102.143:3000/"}start-game`);
    if (sessionId) url.searchParams.append("sessionId", sessionId);

    // Call Express request
    const res = await fetch(url, {
          method: "GET",
          headers: {
            'X-Request-Origin': '/start-game',
            'X-Source': 'expo'
          },
       },
    );

    if (!res.ok) {
      // Handle the error response
      const errorData = await res.json();
      throw new Error(
        `Validation failed: ${errorData.error || "Unknown error"}`,
      );
    }

    const data = await res.json();

    try {
      console.log('checking if a new guest sessionId was generated')
      if (data.sessionId) {
        console.log('it was and is', data.sessionId, 'now storing in secureState')
        await SecureStore.setItemAsync("sessionId", data.sessionId);
      } else {
        console.log('it was not...')
      }
    } catch (err) {
      console.error('error storing guest data in secure store in navbar.tsx mobile', err)
    }

    // Update relevant item in game data state
    setGameData((prevGameData) => ({
      ...prevGameData,
      boardFeed: data.boardFeed,
    }));
  }

  async function handleAutoFindSet(): Promise<void> {
    if (gameData.boardFeed.length >= 12) {
      const sbf = gameData.boardFeed.map((card: Card) => card._id).join(",");
      const sessionId = await SecureStore.getItemAsync("sessionId");
      
      // Create URL object with base URL
      const url = new URL(`${SERVER_URL || "http://10.100.102.143:3000/"}auto-find-set`);
      
      // Add parameters (URLSearchParams handles encoding automatically)
      url.searchParams.append("sbf", sbf);
      if (sessionId) url.searchParams.append("sessionId", sessionId);
      
      const res = await fetch(url.toString(), {
          method: "GET",
          headers: {
              "Content-Type": "application/json",
          },
      });

      if (!res.ok) {
        // Handle the error response
        const errorData = await res.json();
        throw new Error(
          `Validation failed: ${errorData.error || "Unknown error"}`,
        );
      }

      const data = await res.json();
      console.log("auto found set is", data);

      // Update board
      setGameData((gameData: GameData) => ({
        ...gameData,
        autoFoundSet: data,
      }));
    } else {
      console.log("data is not here please start a game");
    }
  }

  async function handleDrawACard() {
    if (gameData.boardFeed.length >= 12) {
      if (gameData.boardFeed.length < 15) {
        const sessionId = await SecureStore.getItemAsync("sessionId");
        const url = new URL(`${SERVER_URL || "http://10.100.102.143:3000/"}draw-a-card`);
        
        if (sessionId) url.searchParams.append("sessionId", sessionId);
        
        // toString() is needed because URL object isn't a string
        // fetch() expects a string URL, not a URL object
        const res = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!res.ok) {
          // Handle the error response
          const errorData = await res.json();
          throw new Error(
            `Validation failed: ${errorData.error || "Unknown error"}`,
          );
        }

        // The entire array is replaced for security reasons
        const data = await res.json();
        console.log("done drawing card");
        // Update boardFeed
        setGameData((prevGameData) => ({
          ...prevGameData,
          boardFeed: data,
        }));
      } else {
        console.log("there are already 15 cards start working on a set!");
      }
    } else {
      console.log("data is not here please start a game");
    }
  }

  async function logOut(): Promise<void> {
    // Default userData and toggle isLoggedIn
    const defaultUserData = {
      _id: "",
      username: "",
      stats: {
        gamesPlayed: 0,
        setsFound: 0,
        speedrun3min: 0,
        speedrunWholeStack: 0,
      },
    };
    setUserData(defaultUserData);
    setIsLoggedIn(false);

    try {
      await SecureStore.deleteItemAsync("sessionId");
      console.log(
        "deleted sessionId from secure storage value now is",
        await SecureStore.getItemAsync("sessionId"),
      );
    } catch (err) {
      console.error("Error clearing secure storage after log out", err);
    }
  }

  return (
    <StyledView className="w-[6%] h-full p-2 bg-purple-500 flex items-center justify-center">
      <StyledView className="w-full h-full bg-yellow-500 p-2 rounded-lg flex flex-col justify-center items-center">
        <StyledTouchableOpacity
          className="flex items-center mb-8"
          onPress={handleStartGame}
        >
          <FontAwesome name="play" size={30} />
        </StyledTouchableOpacity>
        {isCheatModeEnabled && (
          <StyledTouchableOpacity
            className="flex items-center mb-8"
            onPress={handleAutoFindSet}
          >
            <MaterialCommunityIcons name="eye" size={30} />
          </StyledTouchableOpacity>
        )}
        <StyledTouchableOpacity
          className="flex items-center mb-8"
          onPress={handleDrawACard}
        >
          <MaterialCommunityIcons name="cards-outline" size={30} />
        </StyledTouchableOpacity>
        <StyledTouchableOpacity
          className="flex items-center mb-8"
          onPress={() => setIsStatsDialogOpen(true)}
        >
          <Ionicons name="stats-chart" size={30} />
        </StyledTouchableOpacity>
        {/* If loggedIn show logout button and vice versa */}
        {isLoggedIn ? (
          <StyledTouchableOpacity
            className="flex items-center mb-8"
            onPress={logOut}
          >
            <Ionicons name="exit-outline" size={30} color="black" />
          </StyledTouchableOpacity>
        ) : (
          <StyledTouchableOpacity
            className="flex items-center mb-8"
            onPress={() => setIsLoginDialogOpen(!isLoginDialogOpen)}
          >
            <Ionicons name="enter-outline" size={30} color="black" />
          </StyledTouchableOpacity>
        )}
        <StyledTouchableOpacity
          className="flex items-center mb-8"
          onPress={() => setIsSettingsDialogOpen(true)}
        >
          <Ionicons name="settings-sharp" size={30}/>
        </StyledTouchableOpacity>
      </StyledView>
      <LoginModal
        isOpen={isLoginDialogOpen}
        onClose={() => setIsLoginDialogOpen(false)}
      />
      <StatsModal
        isOpen={isStatsDialogOpen}
        onClose={() => setIsStatsDialogOpen(false)}
      />
      <SettingsModal 
        isOpen={isSettingsDialogOpen}
        onClose={() => setIsSettingsDialogOpen(false)}
      />
      <TouchableOpacity onPress={clearSecureStorage}><Text>Clear</Text></TouchableOpacity>
    </StyledView>
  );
}
