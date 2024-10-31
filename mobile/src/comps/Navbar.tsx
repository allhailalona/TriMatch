import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal } from "react-native";
import { styled } from "nativewind";
import { FontAwesome, MaterialCommunityIcons, Ionicons, AntDesign } from '@expo/vector-icons';
import { useGameContext } from '../../context/GameContext'
import { Card, GameData, UserData } from '../../types'

const StyledView = styled(View);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledTextInput = styled(TextInput)

export default function Navbar() {
  const {gameData, setGameData, userData, setUserData, isLoggedIn, setIsLoggedIn} = useGameContext()
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState<boolean>(false)
  const [textFieldValue, setTextFieldValue] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [isOTPSent, setIsOTPSent] = useState<boolean>(false)
  const [isValidText, setIsValidText] = useState<boolean>(true)
  

  async function handleStartGame(): Promise<void> {
    console.log('startGame')
    // Increment gamesPlayed by one if the user is logged in
    if (userData.username.length >= 1) {
      setUserData((prevUserData: UserData) => ({
        ...prevUserData,
        stats: {
          ...prevUserData.stats,
          gamesPlayed: prevUserData.stats.gamesPlayed + 1,
        }
      }));
    }

    // Call Express request
    const res = await fetch("https://set-the-game.onrender.com/start-game", {method: "GET"});

    if (!res.ok) {
      // Handle the error response
      const errorData = await res.json();
      throw new Error(
        `Validation failed: ${errorData.message || "Unknown error"}`,
      );
    }

    const data = await res.json();

    // Update relevant item in game data state
    setGameData(prevGameData => ({
      ...prevGameData,
      boardFeed: data
    }));
  }

  async function handleAutoFindSet(): Promise<void> {
      if (gameData.boardFeed.length >= 12) {
        /*
            Convert boardFeed, which now contains image data as well, to an id only array, which looks
            like the selectedCards array, then MongoDB can find the relevant items in cardProps. This process is done in 
            the front to save bandwitch. sbf stands for strippedBoardFeed
          */
  
        // sbf stands for strippedBoardFeed!
        const sbf = gameData.boardFeed.map((card: Card) => card._id);
        console.log("sbf is", sbf);

        // Convert the array to a comma-separated string
        const sbfString = sbf.join(',');

        // Encode the string to be URL-safe
        const encodedSbf = encodeURIComponent(sbfString);
        console.log('encoded Sbf is', encodedSbf)
  
        console.log("data is here calling express");
        const res = await fetch(`https://set-the-game.onrender.com/auto-find-set?sbf=${encodedSbf}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
  
        if (!res.ok) {
          // Handle the error response
          const errorData = await res.json();
          throw new Error(
            `Validation failed: ${errorData.message || "Unknown error"}`,
          );
        }
  
        const data = await res.json();
        console.log('auto found set is', data)

        // Update board
        setGameData((gameData: GameData) => ({
          ...gameData, 
          autoFoundSet: data
        }))

      } else {
        console.log("data is not here please start a game");
      }
  }

  async function handleDrawACard() {
    if (gameData.boardFeed.length >= 12) {
      if (gameData.boardFeed.length < 15) {
        const res = await fetch("https://set-the-game.onrender.com/draw-a-card", {method: "GET"});

        if (!res.ok) {
          // Handle the error response
          const errorData = await res.json();
          throw new Error(
            `Validation failed: ${errorData.message || "Unknown error"}`,
          );
        }

        // The entire array is replaced for security reasons
        const data = await res.json();
        console.log('done drawing card')
        // Update boardFeed
        setGameData(prevGameData => ({
          ...prevGameData,
          boardFeed: data
        }));
      } else {
        console.log('there are already 15 cards start working on a set!')
      }
    } else {
      console.log("data is not here please start a game");
    }
  };

  async function sendOTP(): Promise<void> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(textFieldValue)) {
      setIsOTPSent(true)
      setIsValidText(true)
      setEmail(textFieldValue)
      setTextFieldValue('') // Clear input
      
      const tempEmail = textFieldValue
      console.log('sending otp to', tempEmail)
      const res = await fetch("https://set-the-game.onrender.com/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: tempEmail }),
      });

      

      if (!res.ok) {
        // Handle the error response
        const errorData = await res.json();
        throw new Error(
          `Validation failed: ${errorData.message || "Unknown error"}`,
        );
      }
    } else {
      console.log('invalid email')
      setIsValidText(false)
    }
  }

  async function validateOTP(): Promise<boolean | void> {
    console.log('trying to validate with ', textFieldValue, 'with email', email)
    const res = await fetch("https://set-the-game.onrender.com/validate-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ OTP: textFieldValue, email }),
      credentials: "include",
    });

    if (!res.ok) {
      const errorData = await res.json();
      if (res.status === 429) {
        alert(errorData.error); // Display the error message
        return;
      } else {
        // Handle the error response
        throw new Error(
          `Validation failed: ${errorData.message || "Unknown error"}`,
        );
      }
    }

    const data = await res.json();
    if (data.isValidated) {
      setIsValidText(true) // For future logins... Pop up is closing anyways
      setEmail('') // The same thing
      setTextFieldValue('') //...
      setIsOTPSent(false) // Expelliarmus!

      // The command to store cookies is not here but in server.ts
      // Neither u can access the cookies in front, they can be accessed via express by adding credentials: include in the request
      console.log('user is validated userData is', data.userData)
      setIsLoginDialogOpen(false) // Close validation dialog
      setIsLoggedIn(true) // Still considered secure since only changes the UI
      setUserData(data.userData) // Provide data like stats, username, etc
    } else {
      setIsValidText(false)
      console.log('invalid OTP please try again!')
    }
  }

  function logOut(): void {
    // Default userData and toggle isLoggedIn
    const defaultUserData = {
      _id: '', 
      username: '', 
      stats: {
        gamesPlayed: 0, 
        setsFound: 0, 
        speedrun3min: 0, 
        speedrunWholeStack: 0
      }
    }
    setUserData(defaultUserData)

    setIsLoggedIn(false)
  }

  return (
    <StyledView className="w-[6%] h-full p-2 bg-purple-500 flex items-center justify-center">
      <StyledView className='w-full h-full bg-yellow-500 p-2 rounded-lg flex flex-col justify-center items-center'>
        <StyledTouchableOpacity className="flex items-center mb-8" onPress={handleStartGame}>
          <FontAwesome name="play" size={30} />
        </StyledTouchableOpacity>
        <StyledTouchableOpacity className="flex items-center mb-8" onPress={handleAutoFindSet}>
          <MaterialCommunityIcons name="eye" size={30} />
        </StyledTouchableOpacity>
        <StyledTouchableOpacity className="flex items-center mb-8" onPress={handleDrawACard}>
          <MaterialCommunityIcons name="cards-outline" size={30} />
        </StyledTouchableOpacity>
        <StyledTouchableOpacity className="flex items-center mb-8" onPress={() => console.log('stats clicked')}>
          <Ionicons name="stats-chart" size={30} />
        </StyledTouchableOpacity>
        {/* If loggedIn show logout button and vice versa */}
        {isLoggedIn ? (
          <StyledTouchableOpacity className="flex items-center mb-8" onPress={logOut}>
            <Ionicons name="exit-outline" size={30} color="black" />
          </StyledTouchableOpacity>
        ) : (
          <StyledTouchableOpacity className="flex items-center mb-8" onPress={() => setIsLoginDialogOpen(!isLoginDialogOpen)}>
            <Ionicons name="enter-outline" size={30} color="black" />
          </StyledTouchableOpacity>
        )}

      </StyledView>
      <Modal
        transparent={true}
        visible={isLoginDialogOpen}
      >
        <StyledTouchableOpacity 
          className="w-full h-full justify-center items-center bg-black/50"
          onPress={() => {
            setIsLoginDialogOpen(false)
            setIsValidText(true) // For future logins... Pop up is closing anyways
            setEmail('') // The same thing
            setTextFieldValue('') //...
            setIsOTPSent(false) // Alohomora!
          }}
        >
          <StyledView 
            className="w-[45%] h-[15%] bg-white pr-3 pb-3 rounded-lg border-4 border-red-400 flex justify-center items-center flex-row gap-3"
            onStartShouldSetResponder={() => true}
            onTouchEnd={e => e.stopPropagation()}
          >
            <TouchableOpacity>
              <AntDesign name="google" size={24} color="black" />
            </TouchableOpacity>
            <StyledTextInput
              placeholder={!isOTPSent ? "Email to send OTP" : "Enter OTP to validate"}
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
    </StyledView>
  );
}
