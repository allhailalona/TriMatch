import { View, Text, TextInput, TouchableOpacity, Modal, Dimensions } from "react-native";
import { styled } from "nativewind";
import React, { useState } from "react";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import GoogleLogin from "../GoogleLogin";
import { useGameContext } from "../../GameContext";
import { AntDesign } from "@expo/vector-icons";

const SERVER_URL = Constants.expoConfig?.extra?.SERVER_URL;

const StyledView = styled(View);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledTextInput = styled(TextInput);

export default function LoginModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { setUserData, setGameData, setIsLoggedIn } = useGameContext();

  const [textFieldValue, setTextFieldValue] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [isValidText, setIsValidText] = useState<boolean>(true);
  const [isOTPSent, setIsOTPSent] = useState<boolean>(false);

  const isMobileView = Dimensions.get('window').width < 768 // Shorter way than the isMobile function

  async function sendOTP(): Promise<void> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(textFieldValue)) {
      setIsOTPSent(true);
      setIsValidText(true);
      setEmail(textFieldValue);
      setTextFieldValue(""); // Clear input

      const tempEmail = textFieldValue;
      console.log("sending otp to", tempEmail);
      const res = await fetch(
        `${SERVER_URL || "http://10.100.102.143:3000/"}send-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: tempEmail }),
        },
      );

      if (!res.ok) {
        // Handle the error response
        const errorData = await res.json();
        throw new Error(
          `Validation failed: ${errorData.error || "Unknown error"}`,
        );
      }
    } else {
      console.log("invalid email");
      setIsValidText(false);
    }
  }

  async function validateOTP(): Promise<boolean | void> {
    console.log(
      "trying to validate with ",
      textFieldValue,
      "with email",
      email,
    );
    const res = await fetch(
      `${SERVER_URL || "http://10.100.102.143:3000/"}validate-otp`,
      {
        method: "POST", // A post request is also used for comparing/validating data
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ OTP: textFieldValue, email }),
        // Cookies are still present since Expo Go uses a WebView comp, in the final apk though, cookies will not be supported.
        // I disable them manually to properly debug my app and test the alternative - expo-secure-store
        credentials: "omit",
      },
    );

    if (!res.ok) {
      const errorData = await res.json();
      if (res.status === 429) {
        alert(errorData.error); // Display the error message
        return;
      } else {
        // Handle the error response
        throw new Error(
          `Validation failed: ${errorData.error || "Unknown error"}`,
        );
      }
    }

    const data = await res.json();
    console.log("sessionId recieved in expo is", data.sessionId);

    if (data.isValidated) {
      resetForm();

      // Clear gameData here as well for cases when the user starts a new game while there is an active one
      setGameData({
        selectedCards: [], 
        autoFoundSet: [], 
        boardFeed: []
      })

      // The Redis states are supposed to be cleared on shuffleNDealCards (assuming the sessionId is identical, otherwise, they'll simply expire)
      // Make sure there are NO 3min speedrun timers running in bg
      console.log('clearing existing timers!')
      const clearTimerRes = await fetch(`${SERVER_URL || "http://10.100.102.143:3000/"}clear-timer`, {method: 'POST'})
      
      if (!clearTimerRes.ok) {
        // Handle the error response
        const errorData = await clearTimerRes.json();
        throw new Error(
          `Clearing timer failed: ${errorData.error || "Unknown error"}`,
        );
      }

      // Update UI with data from server
      setIsLoggedIn(true); // Still considered secure since only changes the UI
      setUserData(data.userData); // Provide data like stats, username, etc

      /* Securely store sessionId with expo-secure-store - web cookies are NOT encrypted but VERIFIED, but I couldnt find a package that 
        mimicks this behavior, and since storing them in an ecnrypted manner essentially does the same, I use expo-secure-store */
      try {
        // This code replaces the previous guest sessionId with id credentials
        await SecureStore.setItemAsync("sessionId", data.sessionId);
        console.log(
          "stored data in SecureStore:",
          await SecureStore.getItemAsync("sessionId"),
        );
      } catch (error) {
        console.error("Error saving data:", error);
      }
    } else {
      setIsValidText(false);
      console.log("invalid OTP please try again!");
    }
  }

  function resetForm() {
    onClose();
    setTextFieldValue("");
    setEmail("");
    setIsValidText(true);
    setIsOTPSent(false);
  }

  return (
    <Modal transparent={true} visible={isOpen}>
      <StyledTouchableOpacity
        className="w-full h-full justify-center items-center bg-black/50"
        onPress={resetForm}
      >
        <StyledView
          className={`${isMobileView ? 'h-[22%] w-[55%]' : 'h-[15%] w-[45%]'} bg-white pr-3 pb-3 rounded-lg flex justify-center items-center flex-row gap-3`}
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <StyledView className="flex justify-center items-center">
            <GoogleLogin />
          </StyledView>
          <StyledTextInput
            placeholder={
              !isOTPSent ? "Email to send OTP" : "Enter OTP to validate"
            }
            onChangeText={setTextFieldValue}
            value={textFieldValue}
            className={`border-2 px-2 py-1 flex-1 text-base
            ${isValidText ? ` border-blue-200` : `border-red-600`}
          `}
            placeholderTextColor="#666"
          />
          {/* Arrow Icon */}
          {isOTPSent ? (
            <TouchableOpacity onPress={validateOTP}>
              <Text>Validate OTP</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={sendOTP}>
              <AntDesign name="arrowright" size={24} color="black" />
            </TouchableOpacity>
          )}
        </StyledView>
      </StyledTouchableOpacity>
    </Modal>
  );
}
