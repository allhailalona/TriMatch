import React from "react";
import { Text, View, TouchableOpacity } from "react-native";
import { styled } from "nativewind";
import Icon from "react-native-vector-icons/MaterialIcons";

const StyledView = styled(View);
const StyledTouchableOpacity = styled(TouchableOpacity);

export default function Navbar() {
  const handleStartGame = () => {
    console.log("Start Game function called");
  };

  const handleAutoFindSet = () => {
    console.log("Auto Find Set function called");
  };

  const handleDrawACard = () => {
    console.log("Draw A Card function called");
  };

  return (
    <StyledView className="w-[6%] h-full p-2 bg-zinc-700">
      <Text>Hello form </Text>
      <StyledView className="w-full h-full p-2 rounded-lg flex flex-col justify-center items-center gap-8 shadow-2xl">
        <StyledTouchableOpacity
          onPress={handleStartGame}
          className="flex flex-col items-center"
        >
          <Icon name="play-arrow" size={24} color="white" />
        </StyledTouchableOpacity>
        <StyledTouchableOpacity
          onPress={handleAutoFindSet}
          className="flex flex-col items-center"
        >
          <Icon name="search" size={24} color="white" />
        </StyledTouchableOpacity>
        <StyledTouchableOpacity
          onPress={handleDrawACard}
          className="flex flex-col items-center"
        >
          <Icon name="add" size={24} color="white" />
        </StyledTouchableOpacity>
      </StyledView>
    </StyledView>
  );
}
