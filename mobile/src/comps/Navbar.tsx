import React, { useState } from "react";
import * as SecureStore from "expo-secure-store";
import { View, TouchableOpacity } from "react-native";
import { styled } from "nativewind";
import { Ionicons, AntDesign, FontAwesome } from "@expo/vector-icons";
import LoginModal from "./modals/LoginModal";
import StatsModal from "./modals/StatsModal";
import SettingsModal from "./modals/SettingsModal";
import { useGameContext } from "../GameContext";
import { useGameLogic } from '../useGameLogic'

const StyledView = styled(View);
const StyledTouchableOpacity = styled(TouchableOpacity);

export default function Navbar() {
  const {
    setUserData,
    isLoggedIn,
    setIsLoggedIn,
    isGameActive,
    resetGameState
  } = useGameContext();

  const { handleStartGame } = useGameLogic()
  
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState<boolean>(false);
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState<boolean>(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState<boolean>(false);

  async function logOut(): Promise<void> {
    resetGameState()

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

  console.log('game is', isGameActive)

  return (
    <StyledView className="w-[6%] h-full p-2 bg-purple-500 flex items-center justify-center">
      <StyledView className="w-full min-h-[40%] max-h-[60%] bg-yellow-400 p-2 rounded-lg flex flex-col justify-center pt-8">
        {isGameActive && (
          <StyledView>            
            <StyledTouchableOpacity
              className="flex items-center mb-8"
              onPress={resetGameState}
            >
              <FontAwesome name="hand-stop-o" size={30} color="black" />
            </StyledTouchableOpacity>
            <StyledTouchableOpacity
              className="flex items-center mb-8"
              onPress={handleStartGame}
            >
              <AntDesign name="reload1" size={30}/>
            </StyledTouchableOpacity>
          </StyledView>
        )}
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
          <Ionicons name="settings-sharp" size={30} />
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
    </StyledView>
  );
}
