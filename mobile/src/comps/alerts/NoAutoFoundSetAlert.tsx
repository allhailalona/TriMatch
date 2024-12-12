// components/NoSetsAlert.tsx
import React, { useEffect } from "react";
import { View, Text, Dimensions } from "react-native";
import { styled } from "nativewind";

// Style components using nativewind
const StyledView = styled(View);
const StyledText = styled(Text);

interface NoSetsAlertProps {
  visible: boolean;
  onClose: () => void;
}

export default function NoSetsAlert({
  visible,
  onClose,
}: NoSetsAlertProps) {
  const isMobileView = Dimensions.get('window').width < 768;

  // Auto-close alert after 2 seconds
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 2000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <StyledView className="absolute top-6 mx-auto left-[10%] right-[10%] bg-white rounded-lg shadow-lg elevation-5">
      <StyledView className="px-6 py-4">
        <StyledView className="flex-row items-start">
          <StyledText className={`mr-3 text-blue-500 ${isMobileView ? 'text-sm' : 'text-4xl'}`}>
            ℹ
          </StyledText>
          <StyledText className={`${isMobileView ? 'text-md' : 'text-2xl'}`}>
            No sets were found, draw a card!
          </StyledText>
        </StyledView>
      </StyledView>
    </StyledView>
  );
}