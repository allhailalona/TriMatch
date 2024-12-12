import React from 'react'
import { View, TouchableOpacity, Text, Linking, Dimensions } from "react-native";
import { styled } from 'nativewind'
import { useGameContext } from '../../GameContext'
import { useGameLogic } from '../../useGameLogic'
import { FontAwesome, MaterialCommunityIcons, AntDesign } from '@expo/vector-icons'

const isMobile = (): { isMobileView: boolean, iconsScale: number} => {
  const width = Dimensions.get('window').width;
  return {
    isMobileView: width < 768, // isMobileView
    iconsScale: width < 768 ? 20 : 40 // iconsScale
  }
 }

const StyledView = styled(View);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledText = styled(Text)

export default function gameInactiveBoard() {
  const { isCheatModeEnabled } = useGameContext()
  const { handleStartGame } = useGameLogic()  
  const { isMobileView, iconsScale } = isMobile()

  return (
    <StyledView className="w-[94%] h-full bg-purple-500 flex flex-row items-center justify-between">
      <StyledTouchableOpacity 
        className={`px-0 flex flex-col grow items-center ${isMobileView && 'ml-[15px]'}`}
        onPress={handleStartGame}
      >
        <StyledView className={`border-4 border-white rounded-lg flex flex-row gap-4 items-center pb-4 pr-4 mb-[200px] max-sm:mb-0 ${isMobileView && 'mb-[80px]'}`}>
          <StyledText className={`font-bold text-xl text-white ${isMobileView && 'text-md'}`}>Start playing!</StyledText>
          <FontAwesome name="play" size={iconsScale} color='white'/>
        </StyledView>
        <StyledView className="flex flex-row gap-2 mb-4">
          <StyledText className={`font-bold text-xl text-white ${isMobileView && 'text-sm'}`}>
            Not sure how to play?
          </StyledText>
          <StyledTouchableOpacity onPress={() => Linking.openURL('https://www.youtube.com/results?search_query=how+to+play+set+the+game')}>
            <StyledText className={`font-bold text-xl text-blue-400 underline ${isMobileView && 'text-sm'}`}>
              Click Here!
            </StyledText>
          </StyledTouchableOpacity>
        </StyledView>
        <StyledTouchableOpacity onPress={() => Linking.openURL('https://github.com/allhailalona/SetTheGame')}>
          <StyledText className={`font-bold text-lg text-center text-blue-400 underline ${isMobileView && 'text-sm'}`}>
            DISCLAIMER and project's Github repo
          </StyledText>
        </StyledTouchableOpacity>
      </StyledTouchableOpacity>
      <StyledView className={`h-[45%] w-[28%] bg-yellow-500 flex flex-col gap-2 justify-center items-center rounded-l-lg pr-10 ${isMobileView && 'h-[60%] pr-6'}`}>
        <StyledView className="w-full flex flex-row gap-4 justify-between items-center">
          <StyledText className={`font-bold text-xl text-white ${isMobileView && 'text-sm'}`}>Stop Game</StyledText>
          <FontAwesome name="hand-stop-o" size={iconsScale} color="black" />
        </StyledView>
        <StyledView className="w-full flex flex-row gap-4 justify-between items-center">
          <StyledText className={`font-bold text-xl text-white ${isMobileView && 'text-sm'}`}>Retry</StyledText>
          <AntDesign name="reload1" size={iconsScale}/>
        </StyledView>
        <StyledView className='w-full flex flex-row gap-4 justify-between items-center'>
          <StyledText className={`font-bold text-xl text-white ${isMobileView && 'text-sm'}`}>Draw A Card</StyledText>
          <MaterialCommunityIcons name="cards" size={iconsScale} color="black" />
        </StyledView>
        {isCheatModeEnabled && (
          <StyledView className='w-full mb-6 flex flex-row gap-4 justify-between items-center'>
            <StyledText className={`font-bold text-xl text-white ${isMobileView && 'text-sm'}`}>Auto Find Set</StyledText>
            <MaterialCommunityIcons name="eye" size={iconsScale} color="black" />
          </StyledView>
        )}
      </StyledView>  
    </StyledView>
    
  )
}