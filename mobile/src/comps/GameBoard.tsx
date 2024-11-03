  import { View, Pressable } from "react-native";
  import { styled } from 'nativewind';
  import { useGameContext } from '../../context/GameContext';
  import { SvgXml } from 'react-native-svg';
  import type { Card, GameData, UserData } from '../../types';

  const StyledView = styled(View);
  const StyledPressable = styled(Pressable)
  const StyledSvgXml = styled(SvgXml);

  export default function GameBoard() {
    const { gameData, setGameData, userData, setUserData } = useGameContext();

    // Select card logic
    const handleSelect = (id : string): void => {
      // If the id is present, filter it
      if (gameData.selectedCards.includes(id)) {
        // React unlike Vue, has immutable states, which have to be cloned to be updated
        setGameData((gameData: GameData) => ({
          ...gameData, 
          selectedCards: gameData.selectedCards.filter((cardId: string) => cardId !== id)
        }))

      // If it's not present, spread and push it
      } else if (gameData.selectedCards.length < 3) {
        const newCards = [...gameData.selectedCards, id];
    
        setGameData((gameData: GameData) => ({
          ...gameData,
          selectedCards: newCards
        }));
      
        if (newCards.length === 3) {
          validate(newCards);
        }
      }
    }

    async function validate(selectedCards: string[]): Promise<void> {
      const res = await fetch(`${process.env.SERVER_URL || 'http://10.100.102.143:3000/'}validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ selectedCards }),
      });
    
      if (!res.ok) {
        // Handle the error response
        const errorData = await res.json();
        throw new Error(
          `Validation failed: ${errorData.message || "Unknown error"}`,
        );
      }
    
      const data = await res.json();
      console.log("hello from GameBoard.tsx after validate call data is", data);
    
      // As an antichceat measure, the entire boardFeed is returned from Redis on each request
      if (data.isValidSet && data.boardFeed !== undefined) {
        // If a username exists (if logged in) update user's stats
        if (userData.username.length >= 1) {
          setUserData((userData: UserData) => ({
            ...userData, 
            stats: {
              ...userData.stats, 
              setsFound: userData.stats.setsFound + 1 
            }
          }));
        }
      }

      console.log('boardFeed is', data.boardFeed)

      // Update anticheat boardFeed data and clear sets regardless of isValidSet value
      setGameData((gameData: GameData) => ({
        ...gameData, 
        boardFeed: data.boardFeed,    
        selectedCards: []             
      }));
    }
    
    // Helper function to generate card class names based on card state
    function getCardClasses(cardId: string): string {
      const baseClasses = "border-4 rounded-lg mx-4 my-5 flex justify-center items-center bg-white py-1";
    
      const selectedBorder = gameData.selectedCards.includes(cardId) 
        ? 'border-green-600' 
        : 'border-black';
    
      // The last border might be overriding the selected border
      // Consider removing the 'border-black' fallbacks
      const autoFoundBorder = gameData.autoFoundSet.includes(cardId) && !gameData.selectedCards.includes(cardId)
        ? 'border-orange-400'
        : ''; // Remove border-black here
    
      return `${baseClasses} ${selectedBorder} ${autoFoundBorder}`.trim();
    }

    // Unforutnately React Native does not support CSS Grid
    const rows = gameData.boardFeed.slice(0, 12).reduce((acc, card, i) => {
      const rowIndex = Math.floor(i / 4);
      acc[rowIndex] = acc[rowIndex] || [];
      acc[rowIndex].push(card);
      return acc;
    }, [] as Card[][]);

    return (
      <StyledView className="w-full h-full flex flex-row flex justify-center items-center bg-purple-500 py-5">
        {/* Left side - Main grid */}
        <StyledView>
          {rows.map((row, rowIndex) => (
            <StyledView key={rowIndex} className="flex flex-row justify-center">
              {row.map((card: Card, index: number) => (
                <StyledPressable 
                  onPress={() => handleSelect(card._id)}
                  key={index}
                  style={{ transform: [{ scale: 1.2 }] }}
                  className={getCardClasses(card._id)}
                >
                  <StyledSvgXml 
                    xml={String.fromCharCode(...card.image.data)}
                    width={100}
                    height={140}
                    preserveAspectRatio="xMidYMid meet"
                    className="bg-white"
                  />
                </StyledPressable>
              ))}
            </StyledView>
          ))}
        </StyledView>
  
        {/* Right side - Extra cards */}
        <StyledView>
          {gameData.boardFeed.length > 12 && 
            gameData.boardFeed.slice(12).map((card: Card, index: number) => (
              <StyledPressable 
                key={index + 12}
                onPress={() => handleSelect(card._id)}
                style={{ transform: [{ scale: 1.2 }] }}
                className={getCardClasses(card._id)}
              >
                <StyledSvgXml 
                  xml={String.fromCharCode(...card.image.data)}
                  width={100}
                  height={140}
                  preserveAspectRatio="xMidYMid meet"
                  className="bg-white"
                />
              </StyledPressable>
            ))
          }
        </StyledView>
      </StyledView>
    );
  }

