import React from 'react'
import { View, TouchableOpacity, Text, Linking } from "react-native";
import { styled } from 'nativewind'
import { useGameContext } from '../../GameContext'
import { useGameLogic } from '../../useGameLogic'
import { FontAwesome, MaterialCommunityIcons, AntDesign } from '@expo/vector-icons'

const StyledView = styled(View);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledText = styled(Text)

export default function gameInactiveBoard() {
  const { isCheatModeEnabled } = useGameContext()

  const { handleStartGame } = useGameLogic()  

  return (
    <StyledView className="w-[94%] h-full bg-purple-500 flex flex-row items-center justify-between">
      <StyledTouchableOpacity 
        className=' w-[70%] px-[200px] flex flex-col justify-center items-center'
        onPress={handleStartGame}
      >
        <StyledView className='border-4  border-white rounded-lg flex flex-row gap-4 items-center pb-4 pr-4 mb-[200px]'>
          <StyledText className='font-bold text-xl text-white'>Start playing!</StyledText>
          <FontAwesome name="play" size={40} color='white'/>
        </StyledView>
        <StyledView className="flex flex-row gap-2 mb-4">
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
            DISCLAIMER and project's Github repo
          </StyledText>
        </StyledTouchableOpacity>
      </StyledTouchableOpacity>
        <StyledView className='h-[38%] w-[24%] bg-yellow-500 flex flex-col gap-2 justify-center items-center rounded-l-lg pr-6'>
          <StyledView className="w-full flex flex-row gap-4 justify-between items-center">
            <StyledText className='font-bold text-xl text-white'>Stop Game</StyledText>
            <FontAwesome name="hand-stop-o" size={24} color="black" />
          </StyledView>
          <StyledView className="w-full flex flex-row gap-4 justify-between items-center">
            <StyledText className='font-bold text-xl text-white'>Retry</StyledText>
            <AntDesign name="reload1" size={24}/>
          </StyledView>
          <StyledView className='w-full flex flex-row gap-4 justify-between items-center'>
            <StyledText className='font-bold text-xl text-white'>Draw A Card</StyledText>
            <MaterialCommunityIcons name="cards" size={24} color="black" />
          </StyledView>
          {isCheatModeEnabled && (
            <StyledView className='w-full mb-6 flex flex-row gap-4 justify-between items-center'>
              <StyledText className='font-bold text-xl text-white'>Auto Find Set</StyledText>
              <MaterialCommunityIcons name="eye" size={24} color="black" />
            </StyledView>
          )}
        </StyledView>  
    </StyledView>
    
  )
}