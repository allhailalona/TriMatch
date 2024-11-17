import React from 'react'
import { View, TouchableOpacity, Text, Linking } from "react-native";
import { styled } from 'nativewind'
import { useGameContext } from '../../GameContext'
import { useGameLogic } from '../../useGameLogic'
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons'

const StyledView = styled(View);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledText = styled(Text)

export default function gameInactiveBoard() {
  const { isCheatModeEnabled } = useGameContext()

  const { handleStartGame } = useGameLogic()  

  return (
    <StyledView className="w-[94%] h-full bg-purple-500 flex flex-row items-center justify-between">
      <StyledView className='w-[20%] h-[40%] py-3 flex flex-col justify-around'>
        <StyledText className='text-xl font-bold text-white'>View User Stats</StyledText>
        <StyledText className='text-xl font-bold text-white'>Log In/Out</StyledText>
        <StyledText className='text-xl font-bold text-white'>Settings</StyledText>
      </StyledView>
      <StyledTouchableOpacity 
        className='w-[30%] flex flex-col justify-center items-center gap-2'
        onPress={handleStartGame}
      >
        <StyledText className='font-bold text-lg text-white'>Greetings! Please choose a game mode from settings before playing!</StyledText>
        <StyledView className='flex flex-row gap-4'>
          <StyledText className='font-bold text-2xl text-white'>Start playing!</StyledText>
          <FontAwesome name="play" size={40} color='white'/>
        </StyledView>
        <StyledView className="flex flex-row gap-2">
          <StyledText className='font-bold text-lg text-white'>
            Not sure how to play?
          </StyledText>
          <StyledTouchableOpacity onPress={() => Linking.openURL('https://www.youtube.com/results?search_query=how+to+play+set+the+game')}>
            <StyledText className='font-bold text-lg text-blue-400 underline'>
              Click Here!
            </StyledText>
          </StyledTouchableOpacity>
        </StyledView>
        <StyledTouchableOpacity onPress={() => Linking.openURL('https://github.com/allhailalona/SetTheGame')}>
          <StyledText className='font-bold text-lg text-center text-blue-400 underline'>
            OR Click here for a DISCLAIMER, and additional info
          </StyledText>
        </StyledTouchableOpacity>
        
      </StyledTouchableOpacity>
      <StyledView>
        <StyledView className='h-[20%] bg-yellow-500 flex justify-center items-center rounded-lg'>
          <StyledView className='h-[50%] flex flex-row gap-4 justify-between items-center p-2 px-4'>
            <StyledText className='font-bold text-2xl text-white'>Draw A Card</StyledText>
            <MaterialCommunityIcons name="cards" size={30} color="black" />
          </StyledView>
          {isCheatModeEnabled && (
            <StyledView className='h-[50%] flex flex-row gap-4 justify-between items-center p-2 px-4'>
              <StyledText className='font-bold text-2xl text-white'>Auto Find Set</StyledText>
              <MaterialCommunityIcons name="eye" size={30} color="black" />
            </StyledView>
          )}
        </StyledView>  
      </StyledView>

    </StyledView>
    
  )
}