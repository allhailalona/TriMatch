import { View, Text, TouchableOpacity, Modal } from "react-native";
import React from "react";
import { styled } from "nativewind";
import { useGameContext } from "../../../context/GameContext";

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
  const { userData } = useGameContext();

  if (!userData) {
    return null; // or return a loading spinner
  }

  return (
    <Modal transparent={true} visible={isOpen}>
      <StyledTouchableOpacity
        className="w-full h-full justify-center items-center bg-black/50"
        onPress={onClose}
      >
        <StyledView
          className="w-[15%] h-[35%] bg-white pr-3 pb-3 rounded-lg border-4 border-red-400 flex justify-center items-center flex-col gap-3"
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <StyledText className="text-lg font-bold">
            Username: {userData.username}
          </StyledText>

          <StyledView className="flex flex-col gap-1">
            <Text>Games Played: {userData.stats.gamesPlayed}</Text>
            <Text>Sets Found: {userData.stats.setsFound}</Text>
            <Text>3 Min Record: {userData.stats.speedrun3min}</Text>
            <Text>Whole Stack Record: {userData.stats.speedrunWholeStack}</Text>
          </StyledView>
        </StyledView>
      </StyledTouchableOpacity>
    </Modal>
  );
}
