import React, { useState, useEffect } from "react";
import { Modal, View, TouchableOpacity, Text } from "react-native";
import { styled } from "nativewind";
import { useGameContext } from "../../../context/GameContext";
import { RadioButton, Checkbox } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Add this import

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

export default function StatsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { gameMode, setGameMode, isCheatModeEnabled, setIsCheatModeEnabled } =
    useGameContext();

  const [isAccordion1Open, setIsAccordion1Open] = useState(false);
  const [isAccordion2Open, setIsAccordion2Open] = useState(false);

  // Load saved values on mount
  useEffect(() => {
    const loadSavedSettings = async (): Promise<void> => {
      try {
        // Get saved game mode (default to '1' if not found)
        const savedGameMode = await AsyncStorage.getItem("gameMode");
        if (savedGameMode) setGameMode(savedGameMode);

        // Get saved cheat mode (default to false if not found)
        const savedCheatMode = await AsyncStorage.getItem("cheatMode");
        if (savedCheatMode) setIsCheatModeEnabled(savedCheatMode === "true");
      } catch (error) {
        console.log("Error loading saved settings:", error);
      }
    };

    loadSavedSettings();
  }, []); // Empty dependency array means this runs once on mount

  // Save game mode to AsyncStorage instead of localStorage
  const handleChangeGameMode = async (newMode: string): Promise<void> => {
    try {
      setGameMode(newMode);
      await AsyncStorage.setItem("gameMode", newMode.toString());
    } catch (error) {
      console.log("Error saving game mode:", error);
    }
  };

  // Toggle accordion states
  const toggleAccordion = (number: number): void => {
    if (number === 1) {
      setIsAccordion1Open(!isAccordion1Open);
      setIsAccordion2Open(false);
    } else {
      setIsAccordion2Open(!isAccordion2Open);
      setIsAccordion1Open(false);
    }
  };

  // Save cheat mode to AsyncStorage instead of localStorage
  const handleChangeCheatMode = async (): Promise<void> => {
    try {
      const newValue = !isCheatModeEnabled;
      setIsCheatModeEnabled(newValue);
      await AsyncStorage.setItem("cheatMode", newValue.toString());
    } catch (error) {
      console.log("Error saving cheat mode:", error);
    }
  };

  return (
    <Modal transparent visible={isOpen}>
      <StyledTouchableOpacity
        className="w-full h-full justify-center items-center bg-black/50"
        onPress={onClose}
      >
        <StyledView
          className="w-[40%] h-auto min-h-[40%] bg-white flex justify-center items-center p-4"
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          {/* First Game Mode Option */}
          <StyledView className="mb-4 border border-gray-200 rounded w-full">
            <StyledTouchableOpacity
              className="flex-row justify-between p-3"
              onPress={() => toggleAccordion(1)}
            >
              <StyledView className="flex-row items-center flex-1">
                <RadioButton
                  value="1"
                  status={gameMode === "1" ? "checked" : "unchecked"}
                  onPress={() => handleChangeGameMode("1")}
                />
                <StyledText className="ml-2 text-lg">
                  Whole Stack Speed Run
                </StyledText>
              </StyledView>
              <StyledText className="text-xl">
                {isAccordion1Open ? "▼" : "▶"}
              </StyledText>
            </StyledTouchableOpacity>

            {isAccordion1Open && (
              <StyledView className="p-3 border-t border-gray-200">
                <StyledText>
                  Full stack marathon - Stopwatch runs until you complete all 81
                  cards. Race against yourself and track your best time!
                </StyledText>
              </StyledView>
            )}
          </StyledView>

          {/* Second Game Mode Option */}
          <StyledView className="mb-4 border border-gray-200 rounded w-full">
            <StyledTouchableOpacity
              className="flex-row justify-between p-3"
              onPress={() => toggleAccordion(2)}
            >
              <StyledView className="flex-row items-center flex-1">
                <RadioButton
                  value="2"
                  status={gameMode === "2" ? "checked" : "unchecked"}
                  onPress={() => handleChangeGameMode("2")}
                />
                <StyledText className="ml-2 text-lg">
                  3-Minute Challenge
                </StyledText>
              </StyledView>
              <StyledText className="text-xl">
                {isAccordion2Open ? "▼" : "▶"}
              </StyledText>
            </StyledTouchableOpacity>

            {isAccordion2Open && (
              <StyledView className="p-3 border-t border-gray-200">
                <StyledText>
                  3-minute speedrun challenge - Complete as much as you can!
                  Your final score is recorded when the timer hits zero.
                </StyledText>
              </StyledView>
            )}
          </StyledView>

          {/* Cheat Mode Toggle */}
          <StyledView className="flex-row justify-between items-center w-full mt-4">
            <StyledView className="flex-row items-center">
              <Checkbox
                status={isCheatModeEnabled ? "checked" : "unchecked"}
                onPress={handleChangeCheatMode}
              />
              <StyledText className="ml-2 text-lg font-bold">
                Cheat Mode
              </StyledText>
            </StyledView>
            <StyledText className="text-lg font-bold text-blue-500 underline">
              DISCLAIMER
            </StyledText>
          </StyledView>
        </StyledView>
      </StyledTouchableOpacity>
    </Modal>
  );
}
