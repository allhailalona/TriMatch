import React from "react";
import { Text, View, TouchableOpacity } from "react-native";
import { styled } from "nativewind";
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';

const StyledView = styled(View);
const StyledTouchableOpacity = styled(TouchableOpacity);

export default function Navbar() {
  async function handleStartGame(): Promise<void> {
    try {
      console.log('startGame')
      // Increment gamesPlayed by one if the user is logged in
      // if (userStore.userData.username.length >= 1) {
      //   userStore.updateUserData({
      //     stats: {
      //       ...userStore.userData.stats,
      //       gamesPlayed: userStore.userData.stats.gamesPlayed + 1,
      //     },
      //   });
      // }
      const res = await fetch("http://172.30.224.1:3000/start-game", {method: "GET"});
  
      if (!res.ok) {
        // Handle the error response
        const errorData = await res.json();
        throw new Error(
          `Validation failed: ${errorData.message || "Unknown error"}`,
        );
      }
  
      const data = await res.json();
  
      console.log("hello from Navbar just recieved boardFeed is", data);
  
      // To maintain reactivity of reactive variables, we must use .splice to update the array
      // Using boardFeed = data will cause boardFeed to point somewhere else
      // fgs.boardFeed.splice(0, fgs.boardFeed.length, ...data);
    } catch (err) {
      console.error('err in handleStartGame func in Navbar.tsx')
      throw err;
    }
  }

  const handleAutoFindSet = () => {
    console.log("Auto Find Set function called");
  };

  const handleDrawACard = () => {
    console.log("Draw A Card function called");
  };

  return (
    <StyledView className="w-[6%] h-full p-2 bg-purple-500 flex items-center justify-center">
      <StyledView className='w-full h-full bg-yellow-500 p-2 rounded-lg flex flex-col justify-center items-center'>
        <StyledTouchableOpacity className="flex items-center mb-8" onPress={handleStartGame}>
          <FontAwesome name="play" size={30} />
        </StyledTouchableOpacity>
        <StyledTouchableOpacity className="flex items-center mb-8" onPress={handleStartGame}>
          <MaterialCommunityIcons name="cards-outline" size={30} />
        </StyledTouchableOpacity>
        <StyledTouchableOpacity className="flex items-center mb-8" onPress={handleStartGame}>
          <MaterialCommunityIcons name="eye" size={30} />
        </StyledTouchableOpacity>
      </StyledView>
    </StyledView>
  );
}
