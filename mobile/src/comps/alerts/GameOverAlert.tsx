// components/GameOverAlert.tsx
import React, { useEffect } from "react";
import { View, Text, Pressable, Dimensions } from "react-native";
import { styled } from "nativewind";
import { GameOverAlertProps } from '../../../types'

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledPressable = styled(Pressable);

export default function GameOverAlert({
  visible,
  message,
  isRecordBroken,
  onClose,
}: GameOverAlertProps) {
  const isMobileView = Dimensions.get('window').width < 768
  
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 10000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <StyledView className="absolute top-6 mx-auto left-[10%] right-[10%] bg-white rounded-lg shadow-lg elevation-5">
      <StyledView className="px-6 py-4">
        <StyledView className="flex-row items-start">
          {/* Status Icon */}
          <StyledView>
            <StyledText
              className={`mr-3 
                ${isRecordBroken ? "text-green-500" : "text-blue-500"}
                ${isMobileView ? 'text-md' : 'text-4xl'}`
              }
            >
              {isRecordBroken ? "✓" : "ℹ"}
            </StyledText>
          </StyledView>

          {/* Title and Message Column */}
          <StyledView className="flex-1">
            <StyledText className="text-3xl font-black">Game Over!</StyledText>
            <StyledText className="text-lg mt-2">{message}</StyledText>
          </StyledView>

          {/* Close Button */}
          <StyledPressable onPress={onClose} className="p-1">
            <StyledText className="text-red-500 text-4xl font-bold">
              ×
            </StyledText>
          </StyledPressable>
        </StyledView>
      </StyledView>
    </StyledView>
  );
}
