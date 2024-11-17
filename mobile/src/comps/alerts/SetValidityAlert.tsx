// components/SetFoundAlert.tsx
import React, { useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import { styled } from "nativewind";

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledPressable = styled(Pressable);

type SetFoundAlertProps = {
 visible: boolean;
 foundSet: boolean; 
 onClose: () => void;
};

export default function SetFoundAlert({
 visible,
 foundSet,
 onClose,
}: SetFoundAlertProps) {
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
         <StyledText className={`text-4xl mr-3 ${foundSet ? "text-green-500" : "text-red-500"}`}>
           {foundSet ? "✓" : "✗"}
         </StyledText>
         <StyledText className="text-2xl">
           {foundSet ? "Congratulations! You found a set!" : "Sorry, that's not a set"}
         </StyledText>
       </StyledView>
     </StyledView>
   </StyledView>
 );
}