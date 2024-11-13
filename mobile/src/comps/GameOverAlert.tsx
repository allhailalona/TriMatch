// components/GameOverAlert.tsx
import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { styled } from "nativewind";

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledPressable = styled(Pressable);

type GameOverAlertProps = {
  visible: boolean;
  message: string;
  isRecordBroken: boolean | null;
  onClose: () => void;
};

export default function GameOverAlert({ visible, message, isRecordBroken, onClose }: GameOverAlertProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 5000);
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
              className={`text-4xl mr-3 ${
                isRecordBroken === true ? 'text-green-500' : 'text-blue-500'
              }`}
            >
              {isRecordBroken === true ? '✓' : 'ℹ'}
            </StyledText>
          </StyledView>
          
          {/* Title and Message Column */}
          <StyledView className="flex-1">
            <StyledText className="text-3xl font-black">
              Game Over!
            </StyledText>
            <StyledText className="text-lg mt-2">
              {message}
            </StyledText>
          </StyledView>
          
          {/* Close Button */}
          <StyledPressable 
            onPress={onClose}
            className="p-1"
          >
            <StyledText className="text-red-500 text-4xl font-bold">
              ×
            </StyledText>
          </StyledPressable>
        </StyledView>
      </StyledView>
    </StyledView>
  );
}