import React, { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { View, TouchableOpacity, Text } from "react-native";
import { styled } from "nativewind";
import { SvgXml } from "react-native-svg";
import { io } from "socket.io-client";
import { MaterialCommunityIcons, FontAwesome, AntDesign } from '@expo/vector-icons'
import GameOverAlert from "../alerts/GameOverAlert";
import SetValidityAlert from '../alerts/SetValidityAlert'
import { useGameContext } from "../../GameContext";
import { useGameLogic } from '../../useGameLogic'
import type { Card, GameData, UserData } from "../../../types";

const StyledView = styled(View);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledText = styled(Text)
const StyledSvgXml = styled(SvgXml);

const SERVER_URL = Constants.expoConfig?.extra?.SERVER_URL;

export default function GameBoard() {
  const { gameData, setGameData, userData, setUserData, isCheatModeEnabled, gameMode, totalSetsFound, setTotalSetsFound, resetGameState } = useGameContext();
  
  const { handleDrawACard, handleAutoFindSet, handleStartGame } = useGameLogic()

  const [showGameOverAlert, setShowGameOverAlert] = useState(false);
  const [gameOverAlertMessage, setGameOverAlertMessage] = useState("");
  const [showSetValidityAlert, setShowSetValidityAlert] = useState(false);
  const [isValidSetNotification, setIsValidSetNotification] = useState(false);
  const [isRecordBroken, setIsRecordBroken] = useState<boolean | null>(null);

  useEffect(() => {
    const socket = io(SERVER_URL || "http://10.100.102.143:2400", {
      transports: ["websocket"], // Force WebSocket transport
      extraHeaders: {
        "X-Source": "expo", // Maintain your existing header
      },
    });

    socket.on("connect", () => {
      console.log("Connected to socket server");
    });

    socket.on("connect_error", (error) => {
      console.log("Socket connection error:", error);
    });

    console.log(
      "items included in toReturn are users score and wether a new record is broken",
    );
    socket.on("3minSpeedRunGameEnded", async (data) => {
      let message = "";
      if (data.isRecordBroken === true) {
        // User is logged in and new record
        setIsRecordBroken(true);
        message = `You found ${data.setsFound} sets - You broke a record! Congratulations!`;
      } else if (data.isRecordBroken === false) {
        // User is logged in but no new record
        setIsRecordBroken(false);
        message = `You found ${data.setsFound} sets - No record broken`;
      } else if (data.isRecordBroken == null) {
        // User is guest (undefined or null) since the isRecordBroken wasn't sent from the server
        setIsRecordBroken(null);
        message = `You are a guest, login to store new records. You found ${data.setsFound} sets`;

        // Since that's a guest we should delete the expo-secure-store sessionId - in web version this will happen with cookies in the server
        try {
          await SecureStore.deleteItemAsync("sessionId");
        } catch (err) {
          console.error(
            "error modifying secure storage in socket useEffect in GameBoard.tsx",
            err,
          );
        }
      }

      // Show alert
      setGameOverAlertMessage(message);
      setShowGameOverAlert(true);

      // Reset game temp data
      setGameData({
        boardFeed: [],
        selectedCards: [],
        autoFoundSet: [],
      });
    });

    // Cleanup
    return () => {
      socket.disconnect();
    };
  }, []);

  // Select card logic
  const handleSelect = (id: string): void => {
    // If the id is present, filter it
    if (gameData.selectedCards.includes(id)) {
      // React unlike Vue, has immutable states, which have to be cloned to be updated
      setGameData((gameData: GameData) => ({
        ...gameData,
        selectedCards: gameData.selectedCards.filter(
          (cardId: string) => cardId !== id,
        ),
      }));

      // If it's not present, spread and push it
    } else if (gameData.selectedCards.length < 3) {
      const newCards = [...gameData.selectedCards, id];

      setGameData((gameData: GameData) => ({
        ...gameData,
        selectedCards: newCards,
      }));

      if (newCards.length === 3) {
        validate(newCards);
      }
    }
  };

  async function validate(selectedCards: string[]): Promise<void> {
    // Try to fetch sessionId so middleware wether to create or not a guest sessions - that's only for expo, in web we include credentials
    let sessionId;
    try {
      sessionId = await SecureStore.getItemAsync("sessionId");
      console.log("sessionId is", sessionId);
    } catch (err) {
      console.error(
        "error retrieving iduser/guest sessionsId from secure store in navbar.tsx mobile",
        err,
      );
    }

    // Build the URL with sessionId as a query parameter if it exists
    const url = new URL(
      `${SERVER_URL || "http://10.100.102.143:2400/"}validate`,
    );
    if (sessionId) url.searchParams.append("sessionId", sessionId);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Source": "expo",
      },
      body: JSON.stringify({ selectedCards }),
    });

    if (!res.ok) {
      // Handle the error response
      const errorData = await res.json();
      throw new Error(
        `Validation failed: ${errorData.error || "Unknown error"}`,
      );
    }

    const data = await res.json();

    // As an antichceat measure, the entire boardFeed is returned from Redis on each request
    if (data.isValidSet) {
      setIsValidSetNotification(data.isValidSet);
      setShowSetValidityAlert(true);  

      setTotalSetsFound((prev: number) => prev + 1) // Again very much not secure, should solve in the future
      // If a username exists (if logged in) update user's stats
      if (userData.username.length >= 1) {
        setUserData((userData: UserData) => ({
          ...userData,
          stats: {
            ...userData.stats,
            setsFound: userData.stats.setsFound + 1,
          },
        }));
      }
    } else {
      console.warn('set not valid')
      setIsValidSetNotification(data.isValidSet);
      setShowSetValidityAlert(true);  
    }

    // If the game is over, show score and/or record notice (if user is logged in)
    if (data.newScore) {
      // Check login status and record status
      let message = "";
      if (data.isRecordBroken === true) {
        // User is logged in and new record
        setIsRecordBroken(true);
        message = `You found ${data.newScore} - You broke a record! Congratulations!`;
      } else if (data.isRecordBroken === false) {
        // User is logged in but no new record
        setIsRecordBroken(false);
        message = `You found ${data.newScore} - No record broken`;
      } else if (data.isRecordBroken == null) {
        // User is guest (undefined or null) since the isRecordBroken wasn't sent from the server
        setIsRecordBroken(null);
        message = `You found ${data.newScore} - Login to store records`;

        // Since that's a guest we should delete the expo-secure-store sessionId - in web version this will happen with cookies in the server
        try {
          await SecureStore.deleteItemAsync("sessionId");
        } catch (err) {
          console.error(
            "error modifying secure storage in socket useEffect in GameBoard.tsx",
            err,
          );
        }
      }

      // Show alert
      setGameOverAlertMessage(message);
      setShowGameOverAlert(true);

      // Reset game temp data to make it possible to find new sets, and prepare for update from server as anticheat measure
      setGameData({
        boardFeed: [],
        selectedCards: [],
        autoFoundSet: [],
      });
    } else {
      // Update anticheat boardFeed data and clear sets regardless of isValidSet value
      setGameData((gameData: GameData) => ({
        ...gameData,
        boardFeed: data.boardFeed,
        selectedCards: [],
      }));
    }
  }

  // Helper function to generate card class names based on card state
  function getCardClasses(cardId: string): string {
    const baseClasses =
      "border-4 rounded-lg mx-4 my-5 flex justify-center items-center bg-white py-1";

    const selectedBorder = gameData.selectedCards.includes(cardId)
      ? "border-green-600"
      : "border-black";

    // The last border might be overriding the selected border
    // Consider removing the 'border-black' fallbacks
    const autoFoundBorder =
      gameData.autoFoundSet.includes(cardId) &&
      !gameData.selectedCards.includes(cardId)
        ? "border-orange-400"
        : ""; // Remove border-black here

    return `${baseClasses} ${selectedBorder} ${autoFoundBorder}`.trim();
  }

  // Unforutnately React Native does not support CSS Grid
  const rows = gameData.boardFeed.slice(0, 12).reduce((acc, card, i) => {
    const rowIndex = Math.floor(i / 4);
    acc[rowIndex] = acc[rowIndex] || [];
    acc[rowIndex].push(card);
    return acc;
  }, [] as Card[][]);

  return (
    <StyledView className='h-full w-[94%] flex flex-row'>
      <StyledView className='w-[96%] h-full flex flex-row bg-purple-500'>
        <StyledView className='h-full w-[15%]'>
          <StyledText className='md:text-xl sm:text-sm text-white font-bold'>{gameMode === '1' ? ('Whole stack') : ('3min Speed Run')}</StyledText>
          <StyledText className='md:text-xl sm:text-sm text-white font-bold'>{totalSetsFound} sets found</StyledText>
          <StyledText className='md:text-xl sm:text-sm text-white font-bold'>{gameMode === '1' ? ('stopwatch is running...') : ('3 min timer is running....')}</StyledText>
        </StyledView>
        <StyledView className="h-full w-[85%] flex flex-row flex justify-center items-center py-5 pr-10">
          {/* Left side - Main grid */}
          <StyledView>
            {rows.map((row, rowIndex) => (
              <StyledView key={rowIndex} className="flex flex-row justify-center">
                {row.map((card: Card, index: number) => (
                  <StyledTouchableOpacity
                    onPress={() => handleSelect(card._id)}
                    key={index}
                    style={{ transform: [{ scale: 1.2 }] }}
                    className={getCardClasses(card._id)}
                  >
                    <StyledSvgXml
                      xml={String.fromCharCode(...card.image.data)}
                      width={100}
                      height={140}
                      preserveAspectRatio="xMidYMid meet"
                      className="bg-white"
                    />
                  </StyledTouchableOpacity>
                ))}
              </StyledView>
            ))}
          </StyledView>

          {/* Right side - Extra cards */}
          <StyledView>
            {gameData.boardFeed.length > 12 &&
              gameData.boardFeed.slice(12).map((card: Card, index: number) => (
                <StyledTouchableOpacity
                  key={index + 12}
                  onPress={() => handleSelect(card._id)}
                  style={{ transform: [{ scale: 1.2 }] }}
                  className={getCardClasses(card._id)}
                >
                  <StyledSvgXml
                    xml={String.fromCharCode(...card.image.data)}
                    width={100}
                    height={140}
                    preserveAspectRatio="xMidYMid meet"
                    className="bg-white"
                  />
                </StyledTouchableOpacity>
              ))}
          </StyledView>

          {/* Ingame notifications */}
          <GameOverAlert
            visible={showGameOverAlert}
            message={gameOverAlertMessage}
            isRecordBroken={isRecordBroken}
            onClose={() => setShowGameOverAlert(false)}
          />
          <SetValidityAlert 
            visible={showSetValidityAlert}
            foundSet={isValidSetNotification}
            onClose={() => setShowSetValidityAlert(false)}
          />
        </StyledView>
      </StyledView>

      <StyledView className='h-full w-[6%] flex flex-col justify-center bg-purple-500'>
        <StyledView className='h-[35%] bg-yellow-500 flex flex-col gap-6 justify-center items-center rounded-l-lg pr-10'>
          <StyledTouchableOpacity onPress={resetGameState}>
            <FontAwesome name="hand-stop-o" size={24} color="black" />
          </StyledTouchableOpacity>
          <StyledTouchableOpacity onPress={handleStartGame}>
            <AntDesign name="reload1" size={24}/>
          </StyledTouchableOpacity>
          <StyledTouchableOpacity onPress={handleDrawACard}>
            <MaterialCommunityIcons name="cards" size={24} color="black" />
          </StyledTouchableOpacity>
          {isCheatModeEnabled && (
            <StyledTouchableOpacity className='mb-4' onPress={handleAutoFindSet}>
              <MaterialCommunityIcons name="eye" size={24} color="black" />
            </StyledTouchableOpacity>
          )}
        </StyledView>
      </StyledView>
    </StyledView>

  );
}
