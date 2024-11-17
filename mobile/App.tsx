import React, { useEffect } from "react";
import { View } from "react-native";
import { styled } from "nativewind";
import Constants from "expo-constants";
import * as SecureStorage from "expo-secure-store";
import Navbar from "./src/comps/Navbar";
import GameActiveBoard from "./src/comps/boards/GameActiveBoard";
import GameInactiveBoard from './src/comps/boards/GameInactiveBoard'
import { GameProvider, useGameContext } from "./src/GameContext";

const SERVER_URL = Constants.expoConfig?.extra?.SERVER_URL;
const StyledView = styled(View);

// Main App component that provides context
export default function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}

// Child component that uses context
function AppContent() {
  const { setUserData, setIsLoggedIn, isGameActive } = useGameContext();

  // Check for active sessions in SecureStorage
  useEffect(() => {
    async function helperFunc() {
      let sessionId = null;

      console.log("checking for active session in secure storage");
      try {
        sessionId = await SecureStorage.getItemAsync("sessionId");
      } catch (err) {
        console.error("Error accessing SecureStorage:", err);
      }

      console.log("Raw SecureStore result:", sessionId);

      if (sessionId !== null) {
        const params = new URLSearchParams({ sessionId });
        const url = `${SERVER_URL || "http://10.100.102.143:3000/"}on-mount-fetch?${params}`;

        const res = await fetch(url, {
          method: "GET",
          headers: {
            "X-Source": "expo",
          },
        });

        if (!res.ok) {
          const errorData = await res.json();
          if (res.status === 401) {
            throw new Error("no active sessions found whatsoever", errorData);
          } else {
            throw new Error("unknown error occured");
          }
        }

        const data = await res.json();

        setIsLoggedIn(true);
        setUserData(data);
      } else {
        console.log("no active session found");
      }
    }

    helperFunc();
  }, []);

  return (
    <StyledView className="w-full h-full flex items-center flex-row">
      <Navbar />
      {isGameActive ? (
        <GameActiveBoard />
      ) : (
        <GameInactiveBoard />
      )}
    </StyledView>
  );
}
