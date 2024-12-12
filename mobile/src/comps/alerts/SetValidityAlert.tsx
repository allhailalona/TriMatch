// components/SetFoundAlert.tsx
import React, { useEffect } from "react";
import { View, Text, Dimensions } from "react-native";
import { styled } from "nativewind";
import { SetFoundAlertProps } from '../../../types'

const StyledView = styled(View);
const StyledText = styled(Text);

const isMobile = (): boolean => {
  const width = Dimensions.get('window').width;
  const isMobileView = width < 768 ? true : false
  return isMobileView
}

export default function SetFoundAlert({
 visible,
 foundSet,
 onClose,
}: SetFoundAlertProps) {
  const isMobileView = isMobile()

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
          <StyledText className={`mr-3 ${foundSet ? "text-green-500" : "text-red-500"} ${isMobileView ? 'text-sm' : 'text-4xl'}`}>
            {foundSet ? "✓" : "✗"}
          </StyledText>
          <StyledText className={`${isMobileView ? 'text-md' : 'text-2xl'}`}>
            {foundSet ? "Congratulations! You found a set!" : "Sorry, that's not a set"}
          </StyledText>
        </StyledView>
      </StyledView>
    </StyledView>
  );
}